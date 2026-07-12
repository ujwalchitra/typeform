"""Seed the database with sample forms and responses."""

from datetime import datetime, timedelta

from app.database import Base, SessionLocal, engine
from app.models import Answer, Form, FormStatus, Question, QuestionType, Response

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Form).count()
        if existing > 0:
            print("Database already seeded, skipping.")
            return

        # Form 1: Customer Feedback Survey
        form1 = Form(
            title="Customer Feedback Survey",
            description="Help us improve our product by sharing your experience.",
            status=FormStatus.PUBLISHED,
            share_slug="feedback2024",
            thank_you_title="Thank you! 🎉",
            thank_you_message="We appreciate your feedback and will use it to improve our product.",
        )
        db.add(form1)
        db.flush()

        q1_questions = [
            Question(
                form_id=form1.id,
                type=QuestionType.SHORT_TEXT,
                title="What's your name?",
                description="We'd love to know who you are.",
                required=True,
                order=0,
            ),
            Question(
                form_id=form1.id,
                type=QuestionType.EMAIL,
                title="What's your email address?",
                description="We'll only use this to follow up if needed.",
                required=True,
                order=1,
            ),
            Question(
                form_id=form1.id,
                type=QuestionType.RATING,
                title="How would you rate your overall experience?",
                description="1 = Poor, 5 = Excellent",
                required=True,
                order=2,
                settings={"max_rating": 5},
            ),
            Question(
                form_id=form1.id,
                type=QuestionType.MULTIPLE_CHOICE,
                title="How did you hear about us?",
                required=False,
                order=3,
                options=["Social Media", "Friend/Colleague", "Search Engine", "Advertisement", "Other"],
            ),
            Question(
                form_id=form1.id,
                type=QuestionType.YES_NO,
                title="Would you recommend us to a friend?",
                required=True,
                order=4,
            ),
            Question(
                form_id=form1.id,
                type=QuestionType.LONG_TEXT,
                title="Any additional comments or suggestions?",
                description="Feel free to share anything else on your mind.",
                required=False,
                order=5,
            ),
        ]
        for q in q1_questions:
            db.add(q)
        db.flush()

        # Form 2: Event Registration (draft)
        form2 = Form(
            title="Tech Conference 2024 Registration",
            description="Register for our annual tech conference.",
            status=FormStatus.DRAFT,
            share_slug="techconf24",
            thank_you_title="You're registered!",
            thank_you_message="Check your email for confirmation details.",
        )
        db.add(form2)
        db.flush()

        q2_questions = [
            Question(
                form_id=form2.id,
                type=QuestionType.SHORT_TEXT,
                title="Full Name",
                required=True,
                order=0,
            ),
            Question(
                form_id=form2.id,
                type=QuestionType.EMAIL,
                title="Email Address",
                required=True,
                order=1,
            ),
            Question(
                form_id=form2.id,
                type=QuestionType.DROPDOWN,
                title="Which session are you most interested in?",
                required=True,
                order=2,
                options=["AI & Machine Learning", "Web Development", "Cloud Infrastructure", "DevOps", "Cybersecurity"],
            ),
            Question(
                form_id=form2.id,
                type=QuestionType.NUMBER,
                title="How many years of experience do you have?",
                required=False,
                order=3,
            ),
        ]
        for q in q2_questions:
            db.add(q)
        db.flush()

        # Form 3: Quick Poll (published)
        form3 = Form(
            title="Quick Team Lunch Poll",
            description="Help us decide where to go for team lunch!",
            status=FormStatus.PUBLISHED,
            share_slug="lunchpoll",
            thank_you_title="Vote recorded! 🍕",
            thank_you_message="We'll announce the winner soon.",
        )
        db.add(form3)
        db.flush()

        q3_questions = [
            Question(
                form_id=form3.id,
                type=QuestionType.MULTIPLE_CHOICE,
                title="Where should we go for lunch?",
                required=True,
                order=0,
                options=["Pizza Place", "Sushi Bar", "Burger Joint", "Salad Bar", "Thai Restaurant"],
            ),
            Question(
                form_id=form3.id,
                type=QuestionType.YES_NO,
                title="Are you vegetarian?",
                required=False,
                order=1,
            ),
        ]
        for q in q3_questions:
            db.add(q)
        db.flush()

        # Seed responses for form1
        sample_responses_1 = [
            {
                "answers": {
                    q1_questions[0].id: "Alice Johnson",
                    q1_questions[1].id: "alice@example.com",
                    q1_questions[2].id: "5",
                    q1_questions[3].id: "Social Media",
                    q1_questions[4].id: "Yes",
                    q1_questions[5].id: "Great product, keep it up!",
                },
                "days_ago": 5,
            },
            {
                "answers": {
                    q1_questions[0].id: "Bob Smith",
                    q1_questions[1].id: "bob@example.com",
                    q1_questions[2].id: "4",
                    q1_questions[3].id: "Friend/Colleague",
                    q1_questions[4].id: "Yes",
                    q1_questions[5].id: "",
                },
                "days_ago": 3,
            },
            {
                "answers": {
                    q1_questions[0].id: "Carol Davis",
                    q1_questions[1].id: "carol@example.com",
                    q1_questions[2].id: "3",
                    q1_questions[3].id: "Search Engine",
                    q1_questions[4].id: "No",
                    q1_questions[5].id: "Could use better documentation.",
                },
                "days_ago": 1,
            },
            {
                "answers": {
                    q1_questions[0].id: "David Lee",
                    q1_questions[1].id: "david@example.com",
                    q1_questions[2].id: "5",
                    q1_questions[3].id: "Advertisement",
                    q1_questions[4].id: "Yes",
                    q1_questions[5].id: "Love the new features!",
                },
                "days_ago": 0,
            },
        ]

        for sr in sample_responses_1:
            resp = Response(
                form_id=form1.id,
                submitted_at=datetime.utcnow() - timedelta(days=sr["days_ago"]),
            )
            db.add(resp)
            db.flush()
            for qid, val in sr["answers"].items():
                if val:
                    db.add(Answer(response_id=resp.id, question_id=qid, value=val))

        # Seed responses for form3
        lunch_votes = [
            ("Pizza Place", "No"),
            ("Sushi Bar", "No"),
            ("Pizza Place", "Yes"),
            ("Thai Restaurant", "No"),
            ("Burger Joint", "No"),
            ("Salad Bar", "Yes"),
            ("Pizza Place", "No"),
        ]
        for i, (lunch, veg) in enumerate(lunch_votes):
            resp = Response(
                form_id=form3.id,
                submitted_at=datetime.utcnow() - timedelta(hours=i * 4),
            )
            db.add(resp)
            db.flush()
            db.add(Answer(response_id=resp.id, question_id=q3_questions[0].id, value=lunch))
            db.add(Answer(response_id=resp.id, question_id=q3_questions[1].id, value=veg))

        db.commit()
        print("Database seeded successfully!")
        print(f"  - Form 1 (published): {form1.title} -> /to/{form1.share_slug}")
        print(f"  - Form 2 (draft): {form2.title}")
        print(f"  - Form 3 (published): {form3.title} -> /to/{form3.share_slug}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
