from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import secrets
import string


class Command(BaseCommand):
    help = 'Reset passwords for all users except markuss and admin'

    def handle(self, *args, **options):
        # Get all users except markuss and admin
        users_to_reset = User.objects.exclude(username__in=['markuss', 'admin'])
        
        password_list = []
        
        for user in users_to_reset:
            # Generate random password (12 characters with letters, digits, and symbols)
            password = ''.join(secrets.choice(string.ascii_letters + string.digits + '!@#$%^&*') for _ in range(12))
            
            # Set the new password
            user.set_password(password)
            user.save()
            
            password_list.append({
                'username': user.username,
                'password': password,
                'email': user.email if user.email else 'No email'
            })
            
            self.stdout.write(f"Reset password for user: {user.username}")
        
        # Print the complete list
        self.stdout.write("\n" + "="*50)
        self.stdout.write("USER PASSWORDS LIST:")
        self.stdout.write("="*50)
        
        for entry in password_list:
            self.stdout.write(f"Username: {entry['username']}")
            self.stdout.write(f"Password: {entry['password']}")
            self.stdout.write(f"Email: {entry['email']}")
            self.stdout.write("-" * 30)
        
        self.stdout.write(f"\nTotal users updated: {len(password_list)}")
        self.stdout.write("Users 'markuss' and 'admin' were NOT changed.")