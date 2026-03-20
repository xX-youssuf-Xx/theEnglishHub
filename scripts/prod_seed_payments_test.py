#!/usr/bin/env python3
"""
Seed production-like test data through backend endpoints.

What this script does:
1) Login as admin
2) Create teachers
3) Create courses
4) Create levels per course
5) Create classes per course with teacher payment config
6) Create students
7) Enroll students into created classes
8) Generate current month sessions and mark them completed
9) (Optional) Generate missing pending payments safety pass

Usage examples:
  python scripts/prod_seed_payments_test.py
  python scripts/prod_seed_payments_test.py --base-url https://englishhub.8bitsolutions.net
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.parse
from typing import Any, Dict, List, Optional

import requests


class ApiError(Exception):
    pass


TEACHER_NAMES = [
    "Ahmed Hassan",
    "Mona Samir",
    "Karim Nabil",
    "Nour Ibrahim",
    "Yasmine Farouk",
    "Omar Adel",
    "Salma Mostafa",
    "Tarek Rashad",
    "Hana Mahmoud",
    "Fadi Khaled",
]

STUDENT_NAMES = [
    "Lina Sami",
    "Yousef Nasser",
    "Mariam Gaber",
    "Adam Hegazy",
    "Farida Shawky",
    "Ziad Helmy",
    "Nada Sobhy",
    "Hussein Kamal",
    "Rana Badr",
    "Basil Ezz",
    "Jana Emad",
    "Malek Saad",
    "Tia Sherif",
    "Rayan Tamer",
    "Maya Lotfy",
    "Kareem Rami",
    "Reem Salah",
    "Nadine Hazem",
    "Sama Wael",
    "Yassin Hani",
]

PARENT_NAMES = [
    "Sami Hassan",
    "Hoda Nabil",
    "Mahmoud Adel",
    "Rania Farouk",
    "Sherif Kamal",
    "Noha Emad",
    "Ayman Salah",
    "Dalia Hany",
]

COURSE_NAMES = [
    "English Conversation",
    "Grammar Foundations",
    "Reading Skills",
    "Writing Workshop",
    "Vocabulary Builder",
    "Speaking Fluency",
    "Listening Lab",
    "Academic English",
]

CLASS_NAMES = [
    "Morning Circle",
    "Sunrise Group",
    "Bridge Group",
    "Focus Group",
    "Summit Group",
    "Horizon Group",
    "Discovery Group",
    "Crescent Group",
    "Pioneer Group",
    "Evergreen Group",
]

LABELS = [
    "Alpha",
    "Bravo",
    "Charlie",
    "Delta",
    "Echo",
    "Foxtrot",
    "Gamma",
    "Helios",
    "Indigo",
    "Jade",
]


def _pick_name(pool: List[str], idx: int) -> str:
    base = pool[idx % len(pool)]
    if idx < len(pool):
        return base
    suffix = LABELS[(idx // len(pool) - 1) % len(LABELS)]
    return f"{base} {suffix}"


def _unwrap_result_data(result_data: Any) -> Any:
    # tRPC may return either data directly or data.json
    if isinstance(result_data, dict) and "json" in result_data:
        return result_data["json"]
    return result_data


def _extract_trpc_data(payload: Any) -> Any:
    """Handle standard tRPC response envelopes (batched/non-batched)."""
    if isinstance(payload, list):
        if not payload:
            return None
        first = payload[0]
        if "error" in first:
            error_obj = first["error"]
            message = error_obj.get("message") or str(error_obj)
            raise ApiError(message)
        result = first.get("result", {})
        return _unwrap_result_data(result.get("data"))

    if isinstance(payload, dict):
        if "error" in payload:
            error_obj = payload["error"]
            message = error_obj.get("message") or str(error_obj)
            raise ApiError(message)
        if "result" in payload:
            result = payload.get("result", {})
            return _unwrap_result_data(result.get("data"))
        return payload

    return payload


class SeedClient:
    def __init__(self, base_url: str, username: str, password: str, timeout: int = 60):
        self.base_url = base_url.rstrip("/")
        self.api_trpc = f"{self.base_url}/api/trpc"
        self.api_auth_login = f"{self.base_url}/api/auth/login"
        self.api_legacy_login = f"{self.base_url}/api/login"
        self.username = username
        self.password = password
        self.timeout = timeout
        self.session = requests.Session()

    def login_admin(self) -> str:
        payload = {"username": self.username, "password": self.password}

        # Try known REST login routes first.
        for login_url in (self.api_auth_login, self.api_legacy_login):
            resp = self.session.post(
                login_url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=self.timeout,
            )
            if resp.status_code < 400:
                data = resp.json()
                token = data.get("token")
                if token:
                    return token

        # Fallback to tRPC auth.login in case proxy only exposes /api/trpc.
        try:
            data = self.trpc_call("auth.login", token="", input_data=payload)
            if isinstance(data, dict) and data.get("token"):
                return data["token"]
        except ApiError:
            pass

        raise ApiError("Login failed on all known endpoints")

    def trpc_call(
        self,
        procedure: str,
        token: str,
        input_data: Optional[Dict[str, Any]] = None,
    ) -> Any:
        url = f"{self.api_trpc}/{procedure}?batch=1"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        body = {"0": input_data}

        resp = self.session.post(
            url,
            headers=headers,
            json=body,
            timeout=self.timeout,
        )

        if resp.status_code >= 400:
            raise ApiError(
                f"HTTP {resp.status_code} calling {procedure}: {resp.text[:400]}"
            )

        return _extract_trpc_data(resp.json())

    def trpc_query(
        self,
        procedure: str,
        token: str,
        input_data: Optional[Dict[str, Any]] = None,
    ) -> Any:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        payload = {"0": input_data}
        encoded = urllib.parse.quote(json.dumps(payload, separators=(",", ":")))
        url = f"{self.api_trpc}/{procedure}?batch=1&input={encoded}"
        resp = self.session.get(url, headers=headers, timeout=self.timeout)

        if resp.status_code >= 400:
            raise ApiError(
                f"HTTP {resp.status_code} querying {procedure}: {resp.text[:400]}"
            )

        return _extract_trpc_data(resp.json())


def create_teachers(
    client: SeedClient, token: str, run_tag: str, count: int
) -> List[Dict[str, str]]:
    teachers = []
    for i in range(1, count + 1):
        full_name = _pick_name(TEACHER_NAMES, i - 1)
        payload = {
            "fullName": full_name,
            "phone": f"010{run_tag[-4:]}{i:03d}",
            "email": f"teacher.{run_tag}.{i}@example.com",
            "address": "City Center",
        }
        data = client.trpc_call("teachers.create", token, payload)
        teachers.append({"id": data["id"], "name": payload["fullName"]})
    return teachers


def create_courses_levels_classes(
    client: SeedClient,
    token: str,
    teachers: List[Dict[str, str]],
    run_tag: str,
    course_count: int,
    levels_per_course: int,
    classes_per_course: int,
    teacher_payment_amount: int,
    teacher_payment_cycle: str,
) -> Dict[str, Any]:
    result: Dict[str, Any] = {"courses": []}

    class_counter = 1
    for course_idx in range(1, course_count + 1):
        course_name = _pick_name(COURSE_NAMES, course_idx - 1)
        course_payload = {
            "name": course_name,
            "description": "Practice-driven English learning track",
            "syllabus": "Conversation, grammar, reading, and writing",
            "sessionsPerMonth": 4,
        }
        course_data = client.trpc_call("courses.create", token, course_payload)
        course_id = course_data["id"]

        levels = []
        for level_num in range(1, levels_per_course + 1):
            level_payload = {
                "courseId": course_id,
                "levelNumber": level_num,
                "durationMonths": 4,
                "pricePerMonth": 250,
                "description": f"Level {level_num}",
                "books": [
                    {
                        "name": f"Workbook {level_num}",
                        "price": 120,
                    },
                    {
                        "name": f"Reader {level_num}",
                        "price": 80,
                    },
                ],
            }
            level_data = client.trpc_call("courses.addLevel", token, level_payload)
            levels.append({"id": level_data["id"], "levelNumber": level_num})

        classes = []
        for class_idx in range(1, classes_per_course + 1):
            level = levels[(class_idx - 1) % len(levels)]
            teacher = teachers[(class_counter - 1) % len(teachers)]
            schedule_shift = (class_counter - 1) % 3

            class_payload = {
                "courseId": course_id,
                "name": _pick_name(CLASS_NAMES, class_counter - 1),
                "levelId": level["id"],
                "teacherId": teacher["id"],
                "teacherPaymentAmount": teacher_payment_amount,
                "teacherPaymentCycle": teacher_payment_cycle,
                "schedules": [
                    {
                        "dayOfWeek": (0 + schedule_shift) % 7,
                        "startTime": "16:00",
                        "endTime": "17:00",
                    },
                    {
                        "dayOfWeek": (2 + schedule_shift) % 7,
                        "startTime": "16:00",
                        "endTime": "17:00",
                    },
                ],
            }
            class_data = client.trpc_call("courses.createClass", token, class_payload)
            classes.append(
                {
                    "id": class_data["id"],
                    "name": class_payload["name"],
                    "levelId": level["id"],
                    "teacherId": teacher["id"],
                    "courseId": course_id,
                }
            )
            class_counter += 1

        result["courses"].append(
            {
                "id": course_id,
                "name": course_payload["name"],
                "levels": levels,
                "classes": classes,
            }
        )

    return result


def create_students(
    client: SeedClient, token: str, run_tag: str, count: int
) -> List[Dict[str, str]]:
    students = []
    for i in range(1, count + 1):
        student_name = _pick_name(STUDENT_NAMES, i - 1)
        parent_name = _pick_name(PARENT_NAMES, i - 1)
        payload = {
            "fullName": student_name,
            "age": 12 + (i % 8),
            "parentName": parent_name,
            "parentPhone": f"011{run_tag[-4:]}{i:03d}",
            "address": "City Center",
            "emergencyContact": f"012{run_tag[-4:]}{i:03d}",
        }
        data = client.trpc_call("students.create", token, payload)
        students.append({"id": data["id"], "name": payload["fullName"]})
    return students


def enroll_students(
    client: SeedClient,
    token: str,
    students: List[Dict[str, str]],
    seeded: Dict[str, Any],
) -> int:
    all_classes = []
    for course in seeded["courses"]:
        all_classes.extend(course["classes"])

    enroll_count = 0
    for i, student in enumerate(students):
        cls = all_classes[i % len(all_classes)]
        payload = {
            "studentId": student["id"],
            "courseId": cls["courseId"],
            "levelId": cls["levelId"],
            "classId": cls["id"],
        }
        client.trpc_call("students.enrollInCourse", token, payload)
        enroll_count += 1
    return enroll_count


def generate_and_complete_month_sessions(
    client: SeedClient,
    token: str,
    run_class_ids: set[str],
) -> int:
    client.trpc_call("sessions.generateSessionsForAllClasses", token, None)

    now = dt.date.today()
    month_start = now.replace(day=1)
    if now.month == 12:
        next_month = dt.date(now.year + 1, 1, 1)
    else:
        next_month = dt.date(now.year, now.month + 1, 1)
    month_end = next_month - dt.timedelta(days=1)

    schedule_data = client.trpc_query(
        "sessions.getWeeklySchedule",
        token,
        {
            "startDate": month_start.isoformat(),
            "endDate": month_end.isoformat(),
        },
    )

    completed = 0
    for day in schedule_data or []:
        for session in day.get("sessions", []):
            class_id = (session.get("class") or {}).get("id")
            if class_id not in run_class_ids:
                continue
            if session.get("status") == "completed":
                continue
            session_id = session.get("id")
            if not session_id:
                continue
            try:
                client.trpc_call(
                    "sessions.markComplete",
                    token,
                    {"sessionId": session_id},
                )
                completed += 1
            except ApiError as exc:
                msg = str(exc)
                if "already marked as completed" in msg:
                    continue
                raise

    return completed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed payment test data via API")
    parser.add_argument(
        "--base-url",
        default=os.getenv("SEED_BASE_URL", "https://englishhub.8bitsolutions.net"),
        help="Backend base URL",
    )
    parser.add_argument(
        "--username",
        default=os.getenv("SEED_ADMIN_USERNAME", "admin"),
        help="Admin username",
    )
    parser.add_argument(
        "--password",
        default=os.getenv("SEED_ADMIN_PASSWORD", "admin123"),
        help="Admin password",
    )
    parser.add_argument("--teachers", type=int, default=5)
    parser.add_argument("--courses", type=int, default=3)
    parser.add_argument("--levels-per-course", type=int, default=3)
    parser.add_argument("--classes-per-course", type=int, default=3)
    parser.add_argument("--students", type=int, default=20)
    parser.add_argument("--teacher-payment-amount", type=int, default=500)
    parser.add_argument("--teacher-payment-cycle", choices=["4", "8"], default="4")
    parser.add_argument(
        "--skip-missing-payments-pass",
        action="store_true",
        help="Skip sessions.generateMissingPendingPayments safety pass",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    run_tag = str(int(time.time()))[-8:]

    client = SeedClient(args.base_url, args.username, args.password)

    print(f"Run tag: {run_tag}")
    print("[1/8] Logging in as admin...")
    token = client.login_admin()

    print(f"[2/8] Creating {args.teachers} teachers...")
    teachers = create_teachers(client, token, run_tag, args.teachers)

    print(
        "[3/8] Creating courses + levels + classes "
        f"({args.courses}x{args.levels_per_course}x{args.classes_per_course})..."
    )
    seeded = create_courses_levels_classes(
        client=client,
        token=token,
        teachers=teachers,
        run_tag=run_tag,
        course_count=args.courses,
        levels_per_course=args.levels_per_course,
        classes_per_course=args.classes_per_course,
        teacher_payment_amount=args.teacher_payment_amount,
        teacher_payment_cycle=args.teacher_payment_cycle,
    )

    print(f"[4/8] Creating {args.students} students...")
    students = create_students(client, token, run_tag, args.students)

    print("[5/8] Enrolling students into created classes...")
    enrolled = enroll_students(client, token, students, seeded)

    print("[6/8] Generating and completing current month sessions...")
    run_class_ids = {
        cls["id"] for course in seeded["courses"] for cls in course["classes"]
    }
    completed = generate_and_complete_month_sessions(client, token, run_class_ids)

    if args.skip_missing_payments_pass:
        print("[7/8] Skipping missing payments safety pass.")
    else:
        print("[7/8] Running missing pending payments safety pass...")
        client.trpc_call("sessions.generateMissingPendingPayments", token, None)

    print("[8/8] Done.")

    levels_created = args.courses * args.levels_per_course
    classes_created = args.courses * args.classes_per_course

    print("\nSummary:")
    print(f"- Run tag: {run_tag}")
    print(f"- Teachers created: {len(teachers)}")
    print(f"- Courses created: {len(seeded['courses'])}")
    print(f"- Levels created: {levels_created}")
    print(f"- Classes created: {classes_created}")
    print(f"- Students created: {len(students)}")
    print(f"- Students enrolled: {enrolled}")
    print(f"- Sessions marked completed this month: {completed}")
    print("\nOpen Payments page and verify grouped pending student/teacher records.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # pragma: no cover
        print(f"ERROR: {exc}")
        sys.exit(1)
