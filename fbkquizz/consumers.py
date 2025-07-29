# chat/consumers.py
import asyncio
import json
import time
import threading

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import UserSettings, User, GlobalSettings, Question


class QuizzConsumer(AsyncWebsocketConsumer):
    """
    DOCS: https://channels.readthedocs.io/en/stable/tutorial/part_1.html
    """

    TIMER = 14
    global_settings = GlobalSettings.objects.get(id=1)

    async def connect(self):

        # self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_name = "mrgreen"
        self.room_group_name = 'Quizz'
        self.user = self.scope['user']

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):

        response = {
            "status": "success",
            "timer": await self.get_timer(),
            # "q_finished":
        }
        received_msg = json.loads(text_data)

        print("INCOMING MESSAGE ========")
        print(received_msg)

        if "points" in received_msg:
            user_key = received_msg["points"]
            add_point = user_key["add_point"]

            success = await self.save_user_settings(user_key, add_point)
            all_user_points = await self.get_all_user_points()
            response["type"] = "points"
            response["user_points"] = all_user_points

        if "direction" in received_msg:
            await self.change_question(received_msg["direction"])
            await self.set_timer(self.TIMER)
            response["type"] = "direction"
            response["direction"] = received_msg["direction"]
            response["timer"] = self.TIMER

        if "start_timer" in received_msg:
            response["type"] = "start_timer"
            response["timer"] = self.TIMER

        if "answer" in received_msg:
            await self.save_user_answer(received_msg["answer"])
            response["type"] = "answer_saved"
            
        if "accept_answer" in received_msg:
            # Only allow admin to accept answers
            if self.user.username == "markuss":
                accept_data = received_msg["accept_answer"]
                success = await self.accept_user_answer(accept_data["username"], accept_data["question_id"])
                if success:
                    all_user_points = await self.get_all_user_points()
                    response["type"] = "answer_accepted"
                    response["accepted_username"] = accept_data["username"]
                    response["question_id"] = accept_data["question_id"]
                    response["user_points"] = all_user_points

        print("RESPONSE SENT")
        print(response)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name, response
        )

    # ================  TYPES ==============
    async def direction(self, event):
        status = event["status"]
        direction = event["direction"]
        await self.send(text_data=json.dumps({"status": status, "direction": direction}))

    # Receive message from room group
    async def points(self, event):
        status = event["status"]
        user_points = event.get("user_points", {})
        await self.send(text_data=json.dumps({
            "status": status, 
            "points": "points",
            "user_points": user_points
        }))

    async def start_timer(self, event):
        timer_thread = threading.Thread(target=asyncio.run, args=(self.thread_start_timer(),))
        timer_thread.start()

    async def timer_ended(self, event):
        status = event["status"]
        correct_answer = event["correct_answer"]
        user_points = event["user_points"]
        all_user_answers = event.get("all_user_answers")
        question_type = event.get("question_type")
        await self.send(text_data=json.dumps({
            "status": status,
            "type": "timer_ended",
            "correct_answer": correct_answer,
            "user_points": user_points,
            "all_user_answers": all_user_answers,
            "question_type": question_type
        }))

    async def answer_saved(self, event):
        status = event["status"]
        await self.send(text_data=json.dumps({
            "status": status,
            "type": "answer_saved"
        }))

    async def answer_accepted(self, event):
        status = event["status"]
        accepted_username = event["accepted_username"]
        question_id = event["question_id"]
        user_points = event["user_points"]
        await self.send(text_data=json.dumps({
            "status": status,
            "type": "answer_accepted",
            "accepted_username": accepted_username,
            "question_id": question_id,
            "user_points": user_points
        }))

    # ================= Operations ===============

    async def thread_start_timer(self):
        if self.TIMER > 0:
            print("Starting timer...")
            for i in reversed(range(0, self.TIMER+1)):
                await self.set_timer(i)
                await self.send(text_data=json.dumps({"timer": i}))
                # self.channel_layer.group_send(
                #     self.room_group_name, {"timer": timer}
                # )
                time.sleep(1)

            await self.allocate_points_and_finish()
            correct_answer = await self.get_current_question_correct_answer()
            all_user_points = await self.get_all_user_points()
            current_question_type = await self.get_current_question_type()
            all_user_answers = await self.get_all_user_answers() if current_question_type == "freeText" else None
            
            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type": "timer_ended",
                    "correct_answer": correct_answer,
                    "user_points": all_user_points,
                    "all_user_answers": all_user_answers,
                    "question_type": current_question_type,
                    "status": "success"
                }
            )

    @database_sync_to_async
    def change_question(self, direction):

        try:
            if direction == "next":
                next_question = self.global_settings.currentQuestion.id + 1
            else:
                next_question = self.global_settings.currentQuestion.id - 1

            question = Question.objects.get(id=next_question)
            
            # Reset the finished status when navigating to a question
            # This allows re-running questions for point allocation
            question.finished = False
            question.save()
            
            self.global_settings.currentQuestion = question
            self.global_settings.save()

        except Question.DoesNotExist:
            pass

    @database_sync_to_async
    def get_timer(self):
        return GlobalSettings.objects.get(id=1).timer

    @database_sync_to_async
    def set_timer(self, timer):
        settings = GlobalSettings.objects.get(id=1)
        settings.timer = timer
        settings.save()

    @database_sync_to_async
    def get_question_finished(self):
        return GlobalSettings.objects.get(id=1).currentQuestion.finished

    @database_sync_to_async
    def set_question_finished(self):
        print("Saving question finished...")
        current_questions = GlobalSettings.objects.get(id=1).currentQuestion
        current_questions.finished = True
        current_questions.save()

    @database_sync_to_async
    def save_user_settings(self, user_key, add_point):

        user = User.objects.get(username=user_key["user"])
        user_setting = UserSettings.objects.get(user=user)

        if add_point:
            user_setting.points += 1
        elif not add_point:
            new_points = user_setting.points - 1
            user_setting.points = new_points

        user_setting.save()

        return True

    @database_sync_to_async
    def save_user_answer(self, answer_data):

        if self.user.username == "markuss":
            return
        user_setting = UserSettings.objects.get(user=self.user)
        current_question_id = GlobalSettings.objects.get(id=1).currentQuestion.id
        
        if not user_setting.answers:
            user_setting.answers = {}
        
        # Handle different answer formats: selected_answer (multiple choice) or text_answer (free text)
        answer = answer_data.get("selected_answer") if "selected_answer" in answer_data else answer_data.get("text_answer")
        
        # Save the answer (empty answers will be saved as empty string for proper point deduction)
        # Use 'is not None' to handle case where selected_answer is 0 (first option)
        user_setting.answers[str(current_question_id)] = answer if answer is not None else ""
        user_setting.save()

    @database_sync_to_async
    def get_current_question_correct_answer(self):
        current_question = GlobalSettings.objects.get(id=1).currentQuestion
        return current_question.answers.get("correct")

    @database_sync_to_async
    def allocate_points_and_finish(self):
        current_question = GlobalSettings.objects.get(id=1).currentQuestion
        print(f"Allocating points for question {current_question.id}: {current_question.title}")
        print(f"Question finished status: {current_question.finished}")
        
        correct_answer = current_question.answers.get("correct")
        question_points = current_question.points
        print(f"Correct answer: {correct_answer}, Points to award: {question_points}")
        
        # Track if we've already processed this question for point allocation
        # by checking if any user has already been awarded points for this specific question
        users_with_answers = UserSettings.objects.filter(
            answers__has_key=str(current_question.id)
        )
        print(f"Users with answers for this question: {users_with_answers.count()}")
        
        # Only allocate points if the question isn't already marked as finished
        # This prevents double allocation when timer runs multiple times
        if not current_question.finished:
            print("Question not finished, allocating points...")
            
            # For freeText questions, also check for users who didn't answer at all
            if current_question.type == "freeText":
                # Process all users instead of just active ones (since active field isn't properly managed)
                all_users = UserSettings.objects.all()
                print(f"Total users: {all_users.count()}")
                
                for user_setting in all_users:
                    # Skip admin user 'markuss' as they don't participate in scoring
                    if user_setting.user.username == "markuss":
                        continue
                        
                    user_answer = user_setting.answers.get(str(current_question.id))
                    print(f"User {user_setting.user.username} answered: '{user_answer}'")
                    
                    if user_answer is not None and str(user_answer).strip():
                        # User provided a non-empty answer
                        if str(user_answer) == str(correct_answer):
                            old_points = user_setting.points
                            user_setting.points += question_points
                            user_setting.save()
                            print(f"Awarded {question_points} points to {user_setting.user.username} (was {old_points}, now {user_setting.points})")
                        else:
                            print(f"User {user_setting.user.username} provided incorrect answer: '{user_answer}'")
                    else:
                        print(f"{user_setting.user.username} did not answer or provided empty answer. Deducting -1 point")
                        # User didn't answer or provided empty answer - subtract 1 point
                        old_points = user_setting.points
                        user_setting.points -= 1
                        user_setting.save()
                        print(f"Subtracted 1 point from {user_setting.user.username} for not answering (was {old_points}, now {user_setting.points})")
            else:
                # Original logic for non-freeText questions
                for user_setting in users_with_answers:
                    user_answer = user_setting.answers[str(current_question.id)]
                    print(f"User {user_setting.user.username} answered: {user_answer}")
                    if str(user_answer) == str(correct_answer):
                        old_points = user_setting.points
                        user_setting.points += question_points
                        user_setting.save()
                        print(f"Awarded {question_points} points to {user_setting.user.username} (was {old_points}, now {user_setting.points})")
            
            current_question.finished = True
            current_question.save()
            print("Question marked as finished")
        else:
            print("Question already finished, skipping point allocation")

    @database_sync_to_async
    def get_all_user_points(self):
        user_points = {}
        for user_setting in UserSettings.objects.select_related('user').all():
            user_points[user_setting.user.username] = {
                'points': user_setting.points
            }
        return user_points

    @database_sync_to_async
    def get_current_question_type(self):
        current_question = GlobalSettings.objects.get(id=1).currentQuestion
        return current_question.type

    @database_sync_to_async
    def get_all_user_answers(self):
        current_question_id = GlobalSettings.objects.get(id=1).currentQuestion.id
        user_answers = []
        
        users_with_answers = UserSettings.objects.filter(
            answers__has_key=str(current_question_id)
        ).select_related('user')
        
        for user_setting in users_with_answers:
            answer = user_setting.answers.get(str(current_question_id))
            if answer is not None and str(answer).strip():  # Only include non-empty answers
                is_accepted = user_setting.accepted_answers.get(str(current_question_id), False) if user_setting.accepted_answers else False
                user_answers.append({
                    'username': user_setting.user.username,
                    'answer': answer,
                    'accepted': is_accepted
                })
        
        return user_answers

    @database_sync_to_async
    def accept_user_answer(self, username, question_id):
        try:
            user = User.objects.get(username=username)
            user_setting = UserSettings.objects.get(user=user)
            question = Question.objects.get(id=question_id)
            
            # Initialize accepted_answers if not exists
            if not user_setting.accepted_answers:
                user_setting.accepted_answers = {}
            
            # Check if answer was already accepted
            if str(question_id) in user_setting.accepted_answers:
                return False
            
            # Mark answer as accepted and award points
            user_setting.accepted_answers[str(question_id)] = True
            user_setting.points += question.points
            user_setting.save()
            
            return True
        except (User.DoesNotExist, UserSettings.DoesNotExist, Question.DoesNotExist):
            return False
