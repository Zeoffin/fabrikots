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
            response["type"] = "points"

        if "direction" in received_msg:
            await self.change_question(received_msg["direction"])
            await self.set_timer(self.TIMER)
            response["type"] = "direction"
            response["direction"] = received_msg["direction"]
            response["timer"] = self.TIMER

        if "start_timer" in received_msg:
            response["type"] = "start_timer"
            response["timer"] = self.TIMER

            # print("After starting timer...")

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
        await self.send(text_data=json.dumps({"status": status, "points": "points"}))  # Send message to WebSocket

    async def start_timer(self, event):
        timer_thread = threading.Thread(target=asyncio.run, args=(self.thread_start_timer(),))
        timer_thread.start()

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

            await self.set_question_finished()

    @database_sync_to_async
    def change_question(self, direction):

        try:
            if direction == "next":
                next_question = self.global_settings.currentQuestion.id + 1
            else:
                next_question = self.global_settings.currentQuestion.id - 1

            question = Question.objects.get(id=next_question)
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
