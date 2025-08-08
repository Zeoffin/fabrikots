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

    # Timer so we dont have to wait a long time when testing questions
    # TODO: Make it 14 only when local env ?
    TIMER = 14

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
            change_result = await self.change_question(received_msg["direction"])
            
            if change_result == "quiz_ended":
                # Quiz has ended, send leaderboard data
                all_user_points = await self.get_all_user_points()
                response["type"] = "quiz_ended"
                response["user_points"] = all_user_points
            else:
                # Normal question change
                current_question_time = await self.get_current_question_time()
                if current_question_time == -1:
                    await self.set_timer(-1)
                    response["timer"] = -1
                else:
                    await self.set_timer(current_question_time)
                    response["timer"] = current_question_time
                response["type"] = "direction"
                response["direction"] = received_msg["direction"]

        if "start_timer" in received_msg:
            current_question_time = await self.get_current_question_time()
            current_question_type = await self.get_current_question_type()
            
            # Don't start timer for info questions with time = -1
            if current_question_type == "info" and current_question_time == -1:
                response["type"] = "timer_skipped"
                response["timer"] = -1
            else:
                response["type"] = "start_timer"
                response["timer"] = current_question_time

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

        if "wheelspin" in received_msg:
            # Only allow admin to trigger wheelspins
            if self.user.username == "markuss":
                wheelspin_data = received_msg["wheelspin"]
                target_user = wheelspin_data["target_user"]
                action = wheelspin_data["action"]
                amount = wheelspin_data.get("amount", 0)
                other_user = wheelspin_data.get("other_user", "")
                
                # success = await self.process_wheelspin_action(target_user, action, amount, other_user)
                # if success:
                #     all_user_points = await self.get_all_user_points()
                #     response["type"] = "wheelspin_result"
                #     response["target_user"] = target_user
                #     response["action"] = action
                #     response["amount"] = amount
                #     response["other_user"] = other_user
                #     response["user_points"] = all_user_points

        if "wheelspin_start" in received_msg:
            # Only allow admin to start wheelspins - this shows the wheel to everyone
            if self.user.username == "markuss":
                import random
                wheelspin_start_data = received_msg["wheelspin_start"]
                
                # Define wheel actions on server side (must match frontend)
                def get_random_hsl():
                    import random
                    hue = random.randint(0, 360)
                    saturation = random.randint(1, 100)
                    lightness = random.randint(1, 100)
                    return f"hsl({hue}, {saturation}%, {lightness}%)"
                
                wheel_actions = [
                    {"id": "mute_3_rounds", "label": "Tev mute on discord for 3 rounds", "color": get_random_hsl()},
                    {"id": "mute_3_rounds", "label": "Kādam citam mute on discord uz 4 rounds", "color": get_random_hsl()},
                    {"id": "no_effect", "label": "Nu neko nedabūji", "color": get_random_hsl()},
                    {"id": "add_5_points", "label": "+5 punkti", "color": get_random_hsl()},
                    {"id": "add_5_points", "label": "+1 punkti", "color": get_random_hsl()},
                    {"id": "add_5_points", "label": "+3 punkti", "color": get_random_hsl()},
                    {"id": "remove_1_point", "label": "-1 punkts", "color": get_random_hsl()},
                    {"id": "remove_10_point", "label": "-10 punkti", "color": get_random_hsl()},
                    {"id": "remove_3_point", "label": "-3 punkti", "color": get_random_hsl()},
                    {"id": "swap_points", "label": "Punktu Maiņa", "color": get_random_hsl()},
                    {"id": "no_effect", "label": "Nu neko nedabūji", "color": get_random_hsl()}
                ]
                
                # Server determines the result
                selected_action_index = random.randint(0, len(wheel_actions) - 1)
                selected_action = wheel_actions[selected_action_index]
                
                # Calculate precise rotation to land on the selected section
                base_rotations = 5 + random.random() * 3  # 5-8 full rotations for good visual effect
                angle_per_section = (2 * 3.14159) / len(wheel_actions)
                
                # Calculate the center angle of the target section
                # The wheel is drawn starting from index 0, and the pointer points up (top)
                target_angle = selected_action_index * angle_per_section + (angle_per_section / 2)
                
                # Final rotation = base rotations + adjustment to land on target
                # We need to subtract the target angle because the wheel rotates clockwise
                final_rotation = (base_rotations * 2 * 3.14159) - target_angle
                
                # Add the selected action index for frontend to verify
                response["selected_action_index"] = selected_action_index
                
                response["type"] = "wheelspin_start"
                response["target_user"] = wheelspin_start_data["target_user"]
                response["final_rotation"] = final_rotation
                response["selected_action"] = selected_action
                response["spin_duration"] = 3000

        print("RESPONSE SENT")
        print(response)

        # Only send message to room group if there's a valid type
        if "type" in response:
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
        vote_results = event.get("vote_results")
        detailed_vote_results = event.get("detailed_vote_results")
        multiple_choice_results = event.get("multiple_choice_results")
        question_type = event.get("question_type")
        await self.send(text_data=json.dumps({
            "status": status,
            "type": "timer_ended",
            "correct_answer": correct_answer,
            "user_points": user_points,
            "all_user_answers": all_user_answers,
            "vote_results": vote_results,
            "detailed_vote_results": detailed_vote_results,
            "multiple_choice_results": multiple_choice_results,
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

    async def wheelspin_result(self, event):
        status = event["status"]
        target_user = event["target_user"]
        action = event["action"]
        amount = event["amount"]
        other_user = event["other_user"]
        user_points = event["user_points"]
        await self.send(text_data=json.dumps({
            "status": status,
            "type": "wheelspin_result",
            "target_user": target_user,
            "action": action,
            "amount": amount,
            "other_user": other_user,
            "user_points": user_points
        }))

    async def wheelspin_start(self, event):
        status = event["status"]
        target_user = event["target_user"]
        final_rotation = event["final_rotation"]
        selected_action = event["selected_action"]
        spin_duration = event["spin_duration"]
        selected_action_index = event.get("selected_action_index", 0)
        await self.send(text_data=json.dumps({
            "status": status,
            "type": "wheelspin_start",
            "target_user": target_user,
            "final_rotation": final_rotation,
            "selected_action": selected_action,
            "spin_duration": spin_duration,
            "selected_action_index": selected_action_index
        }))

    async def quiz_ended(self, event):
        status = event["status"]
        user_points = event["user_points"]
        await self.send(text_data=json.dumps({
            "status": status,
            "type": "quiz_ended",
            "user_points": user_points
        }))

    # ================= Operations ===============

    async def thread_start_timer(self):
        current_question_time = await self.get_current_question_time()
        current_question_type = await self.get_current_question_type()
        
        # Skip timer for info questions with time = -1
        if current_question_type == "info" and current_question_time == -1:
            print("Skipping timer for info question with time = -1")
            return
            
        timer_duration = current_question_time if current_question_time > 0 else self.TIMER
        # timer_duration = self.TIMER
        
        if timer_duration > 0:
            print(f"Starting timer for {timer_duration} seconds...")
            for i in reversed(range(0, timer_duration+1)):
                await self.set_timer(i)
                await self.send(text_data=json.dumps({"timer": i}))
                # self.channel_layer.group_send(
                #     self.room_group_name, {"timer": timer}
                # )
                time.sleep(1)

            await self.allocate_points_and_finish()
            correct_answer = await self.get_current_question_correct_answer()
            all_user_points = await self.get_all_user_points()
            all_user_answers = await self.get_all_user_answers() if current_question_type == "freeText" else None
            vote_results = await self.get_vote_results() if current_question_type == "userChoice" else None
            detailed_vote_results = await self.get_detailed_vote_results() if current_question_type == "userChoice" else None
            multiple_choice_results = await self.get_multiple_choice_results() if current_question_type == "multipleChoice" else None
            
            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type": "timer_ended",
                    "correct_answer": correct_answer,
                    "user_points": all_user_points,
                    "all_user_answers": all_user_answers,
                    "vote_results": vote_results,
                    "detailed_vote_results": detailed_vote_results,
                    "multiple_choice_results": multiple_choice_results,
                    "question_type": current_question_type,
                    "status": "success"
                }
            )

    @database_sync_to_async
    def change_question(self, direction):

        try:
            global_settings = GlobalSettings.objects.get(id=1)
            
            if direction == "next":
                next_question = global_settings.currentQuestion.id + 1
            else:
                next_question = global_settings.currentQuestion.id - 1

            # Check if we're trying to go past the last question
            if direction == "next":
                last_question = Question.objects.last()
                if last_question and global_settings.currentQuestion.id >= last_question.id:
                    # We've reached the end of the quiz, return special signal
                    return "quiz_ended"

            question = Question.objects.get(id=next_question)
            
            # Reset the finished status when navigating to a question
            # This allows re-running questions for point allocation
            question.finished = False
            question.save()
            
            global_settings.currentQuestion = question
            global_settings.save()
            
            return "question_changed"

        except Question.DoesNotExist:
            return "no_question"

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
        
        # Handle different answer formats: selected_answer (multiple choice), text_answer (free text), or selected_user (userChoice)
        answer = answer_data.get("selected_answer") if "selected_answer" in answer_data else answer_data.get("text_answer") if "text_answer" in answer_data else answer_data.get("selected_user")
        
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

            elif current_question.type == "info":
                print("Info Q type, not allocating any points")

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
    def get_current_question_time(self):
        current_question = GlobalSettings.objects.get(id=1).currentQuestion
        return current_question.time

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

    @database_sync_to_async
    def get_vote_results(self):
        current_question_id = GlobalSettings.objects.get(id=1).currentQuestion.id
        vote_counts = {}
        
        # Get all user answers for the current question
        users_with_answers = UserSettings.objects.filter(
            answers__has_key=str(current_question_id)
        ).select_related('user')
        
        for user_setting in users_with_answers:
            # Skip admin user
            if user_setting.user.username == "markuss":
                continue
                
            voted_for = user_setting.answers.get(str(current_question_id))
            if voted_for and str(voted_for).strip():
                vote_counts[voted_for] = vote_counts.get(voted_for, 0) + 1
        
        return vote_counts

    @database_sync_to_async
    def get_detailed_vote_results(self):
        """Get detailed vote results showing who voted for whom for userChoice questions"""
        current_question_id = GlobalSettings.objects.get(id=1).currentQuestion.id
        detailed_votes = {}
        
        # Get all user answers for the current question
        users_with_answers = UserSettings.objects.filter(
            answers__has_key=str(current_question_id)
        ).select_related('user')
        
        for user_setting in users_with_answers:
            # Skip admin user
            if user_setting.user.username == "markuss":
                continue
                
            voted_for = user_setting.answers.get(str(current_question_id))
            if voted_for and str(voted_for).strip():
                if voted_for not in detailed_votes:
                    detailed_votes[voted_for] = []
                detailed_votes[voted_for].append(user_setting.user.username)
        
        return detailed_votes

    @database_sync_to_async  
    def get_multiple_choice_results(self):
        """Get multiple choice answer distribution with usernames for each choice"""
        current_question_id = GlobalSettings.objects.get(id=1).currentQuestion.id
        choice_results = {}
        
        # Get all user answers for the current question
        users_with_answers = UserSettings.objects.filter(
            answers__has_key=str(current_question_id)
        ).select_related('user')
        
        for user_setting in users_with_answers:
            # Skip admin user
            if user_setting.user.username == "markuss":
                continue
                
            selected_choice = user_setting.answers.get(str(current_question_id))
            if selected_choice is not None:  # Handle case where choice is 0
                choice_key = str(selected_choice)
                if choice_key not in choice_results:
                    choice_results[choice_key] = []
                choice_results[choice_key].append(user_setting.user.username)
        
        return choice_results

    @database_sync_to_async
    def process_wheelspin_action(self, target_user, action, amount, other_user):
        """Process wheelspin actions on users"""
        try:
            target_user_obj = User.objects.get(username=target_user)
            target_settings = UserSettings.objects.get(user=target_user_obj)
            current_round = GlobalSettings.objects.get(id=1).current_round
            
            if action == "add_points":
                target_settings.points += amount
                target_settings.save()
            
            elif action == "remove_points":
                target_settings.points = max(0, target_settings.points - amount)
                target_settings.save()
            
            elif action == "spin_again":
                # This is handled on the frontend
                pass
            
            elif action == "swap_points":
                if other_user:
                    other_user_obj = User.objects.get(username=other_user)
                    other_settings = UserSettings.objects.get(user=other_user_obj)
                    
                    # Swap points
                    temp_points = target_settings.points
                    target_settings.points = other_settings.points
                    other_settings.points = temp_points
                    
                    target_settings.save()
                    other_settings.save()
            
            elif action == "mute_1_round":
                target_settings.muted_until_round = current_round + 1
                target_settings.save()
            
            elif action == "mute_3_rounds":
                target_settings.muted_until_round = current_round + 3
                target_settings.save()
            
            elif action == "add_points_other":
                if other_user:
                    other_user_obj = User.objects.get(username=other_user)
                    other_settings = UserSettings.objects.get(user=other_user_obj)
                    other_settings.points += amount
                    other_settings.save()
            
            elif action == "remove_points_other":
                if other_user:
                    other_user_obj = User.objects.get(username=other_user)
                    other_settings = UserSettings.objects.get(user=other_user_obj)
                    other_settings.points = max(0, other_settings.points - amount)
                    other_settings.save()
            
            elif action == "no_effect":
                # Lucky! No effect - do nothing
                pass
            
            return True
            
        except (User.DoesNotExist, UserSettings.DoesNotExist):
            return False
