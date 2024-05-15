# chat/consumers.py
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import UserSettings, User


class QuizzConsumer(AsyncWebsocketConsumer):
    """
    DOCS: https://channels.readthedocs.io/en/stable/tutorial/part_1.html
    """

    async def connect(self):

        # self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_name = "mrgreen"
        self.room_group_name = 'Quizz'

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):

        text_json = json.loads(text_data)

        if "points" in text_json:
            user_key = text_json["points"]
            add_point = user_key["add_point"]

            success = await self.save_user_settings(user_key, add_point)

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "points", "status": "success"}
            )

            # self.send(text_data=json.dumps({"status": "success"}))

    # Receive message from room group
    async def points(self, event):
        status = event["status"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"status": status}))

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
