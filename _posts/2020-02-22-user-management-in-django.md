---
title: How to setup your own user module in Django
tags: [Django, Python]
---

## Context
Once you have laid the foundation of your Django project, it is time to move on to actually turning your project into a usable app. An essential part of any app is user management. You need to have the functionality in place that lets users signup, login, edit their profiles, and so on. In an effort to keep things organized and also allow for future expansions, I will create a separate user app within our project and create a custom user model. This will help further down the road if we need to expand the built-in user model with new fields and functionality. Also, to streamline authentication, I will use the package `django-allauth`. This package will handle authentication and, again thinking of potential extensions down the road, also allows third-party login capabilities (the famous "Login with Google/Twitter/GitHub/etc"). So let's get started.

## Create a separate user app
Go to your Django folder (second level), and create a separate app that holds all information regarding users:

```python
python manage.py startapp users
```

Additionally, create the following files:
```shell
cd users
touch urls.py
touch forms.py
```
## Modify the custom code
Here we will edit the *models.py* and *views.py* files inside our new app. We will also create *forms.py* to adjust the standard authentication forms.


### Models
The user class is based on the built-in *AbstractUser* class. Additionally, we define a couple of extra fields, which we can extend later based on our requirements. We also automatically generate a random and unique eight-character ID for our users, so we can easily link to their profile.

```python
from django.contrib.auth.models import AbstractUser
from django.db import models
from random import choice
from string import ascii_lowercase, digits
from uuid import uuid4


def id_generator(size=8, chars=ascii_lowercase + digits):
    return ''.join(choice(chars) for _ in range(size))


class CustomUser(AbstractUser):
    # add additional fields in here
    url_short = models.CharField(max_length=8, unique=True)
    home_town = models.CharField(max_length=50, null=True, blank=True)
    home_country = models.CharField(max_length=50, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.url_short:
            # Generate ID once, then check the db. If exists, keep trying.
            self.url_short = id_generator()
            while CustomUser.objects.filter(url_short=self.url_short).exists():
                self.url_short = id_generator()
        super(CustomUser, self).save()

    def __str__(self):
        return self.email


def get_image_filename(instance, filename):
    url_short = instance.user.url_short
    file_ending = filename.split('.')[-1]
    return 'users/profile_images/{}/{}.{}'.format(url_short, uuid4(), file_ending)


class ProfileImage(models.Model):
    user = models.ForeignKey(CustomUser, related_name='profile_images', default=None, on_delete=models.CASCADE)
    image = models.ImageField(upload_to=get_image_filename, verbose_name='Profile_image')

```

### Views

There are three essentials views we want:
* The user list, for staff and admins to access an overview list of users
* The user profile, which may be accessed by the user themself or
* The user update, which allows users to update their information and upload a profile picture

```python
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.admin.views.decorators import staff_member_required
from django.forms import modelformset_factory
from django.contrib import messages
from .models import CustomUser, ProfileImage
from .forms import CustomUserUpdateForm, ProfileImageForm


@staff_member_required
def user_list(request):
    users = CustomUser.objects.all()
    return render(request, 'user_list.html', {'users': users})


def user_profile(request, url_short):
    user = get_object_or_404(CustomUser, url_short=url_short)
    return render(request, 'user_profile.html', {'url_short': url_short, 'user': user})


@login_required
def user_update(request, url_short):
    if request.user.is_staff:
        user = get_object_or_404(CustomUser, url_short=url_short)
    else:
        user = request.user

    profile_image_formset = modelformset_factory(ProfileImage, form=ProfileImageForm, extra=1)

    if request.method == 'POST':

        user_update_form = CustomUserUpdateForm(request.POST, instance=user)

        formset = profile_image_formset(request.POST, request.FILES, queryset=ProfileImage.objects.none())

        if user_update_form.is_valid() and formset.is_valid():
            user_update_form = user_update_form.save(commit=False)
            user_update_form.save()

            for form in formset.cleaned_data:
                if form:
                    image = form['profile_image']
                    photo = ProfileImage(user=user, image=image)
                    photo.save()
                messages.success(request, 'Profile image upload done')

            return redirect('user_profile', url_short)
        else:
            print(user_update_form.errors)

    else:
        user_update_form = CustomUserUpdateForm(instance=user)
        formset = profile_image_formset(queryset=ProfileImage.objects.none())

    return render(request, 'user_update.html', {'form': user_update_form, 'user': user, 'formset': formset})
```


### Forms

Based on the models and views we created, let's set up the forms we need to create, change, and update users, including the form to upload a profile picture:

```python
from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import CustomUser, ProfileImage


class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = ('username', 'email')


class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = CustomUser
        fields = ('username', 'email')


class CustomUserUpdateForm(forms.ModelForm):
    first_name = forms.CharField(widget=forms.TextInput(), max_length=50, label='First name', )
    last_name = forms.CharField(widget=forms.TextInput(), max_length=50, label='Last name', required=False)
    home_town = forms.CharField(widget=forms.TextInput(), max_length=50, label='City', required=False)
    home_country = forms.CharField(widget=forms.TextInput(), max_length=50, label='Country', required=False)

    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'home_town', 'home_country')

class ProfileImageForm(forms.ModelForm):
    profile_image = forms.ImageField(label='Change profile image')

    class Meta:
        model = ProfileImage
        fields = ['profile_image', ]

```

### URLs

All user-related URLs go into the separate *urls.py* file that we created earlier. Enter the following URLs in the file:

```python
from django.urls import path
from .views import user_list, user_profile, user_update

urlpatterns = [
    path('list/', user_list, name='user_list'),
    path('profile/<url_short>/', user_profile, name='user_profile'),
    path('profile/<url_short>/edit/', user_update, name='user_update'),
]
```

These patterns allow us to retrieve a list of all users (if we are admin or staff), view our user profile, and edit it.

Let's make sure Django picks up all these URLs at the common prefix *users/*, so we add the following pattern to our central app's *urls.py* file:

```python
urlpatterns = [
    from django.urls import path, include # Make sure to import include here since we need it below
    # ...
    path('users/', include('users.urls')),
]

```


### Admin

Here, we want to register the forms we just created as well as the model and the fields we want to display. Head over to the *admin.py* file and make sure it looks like this:

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import CustomUser


class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = ['email', 'username', ]


admin.site.register(CustomUser, CustomUserAdmin)
```

### Don't forget!

There are three important steps after creating a new app:

* As with every app we are creating, we need to add it to *settings.py*. Let's do so by adding it to *INSTALLED_APPS* and telling Django we are using a custom model:

    ```python
    INSTALLED_APPS = [
        # ...

        # Proprietary
        'users.apps.UsersConfig',
        # ...
    ]

    AUTH_USER_MODEL = 'users.CustomUser'
    ```

* Next, we need to install *Pillow*, a Python Image Library that handles some image tasks behind the scenes. You got this by now:

    ```shell
    pip install pillow
    pip freeze > requirements.txt
    ```

* Finally, we need to make the database migrations and apply them:

    ```shell
    python manage.py makemigrations
    python manage.py migrate
    ```

## But how do people sign up?

To allow users to sign up we need the corresponding views and forms correct? We will make our life a bit easier here and use a third party package called Django Allauth ([read the docs here](https://django-allauth.readthedocs.io/en/latest/)). This is handy because it will give us all the views we need, plus it let's us easily integrate auth providers such as Google, Twitter, etc. later down the road if we want people to use our service with their Google account for example.

### Install it

From your project's root folder, run:

```shell
pip install django-allauth
pip freeze > requirements.txt
```

### Tell Django about it

First, add the app in your *settings.py* file:

```python
INSTALLED_APPS = [
    # ...

    # Vendor
    #...
    'allauth',
    'allauth.account',
    # ...
]
```

Next, update the dictionary key *['OPTIONS']['context_processors']* in the TEMPLATES list such that it looks like this:

```python
'django.template.context_processors.debug',
'django.template.context_processors.request',
'django.contrib.auth.context_processors.auth',
'django.contrib.messages.context_processors.messages',
'magellan.data.app_data',

# Allauth needs this from django
'django.template.context_processors.request',
```

Now, still in *settings.py*, add a whole set of variables:

```python
# Allauth, Login, Email setup
AUTHENTICATION_BACKENDS = (
    # Needed to login by username in Django admin, regardless of Allauth
    'django.contrib.auth.backends.ModelBackend',
    # Allauth specific authentication methods, such as login by e-mail
    'allauth.account.auth_backends.AuthenticationBackend',
)

SITE_ID = 1

ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_SIGNUP_PASSWORD_ENTER_TWICE = False
ACCOUNT_SESSION_REMEMBER = True
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_CONFIRM_EMAIL_ON_GET = True
ACCOUNT_LOGOUT_REDIRECT_URL = 'home'
LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = 'home'


EMAIL_HOST = config('EMAIL_HOST')
EMAIL_PORT = config('EMAIL_PORT', cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', cast=bool)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL')
```

This takes care of a variety of things. It configures the authentication backend the app is now supposed to use, sets various variables depending on how we want the authentication to behave, and finally we read all variables and keys regarding the transactional email service for email confirmations.

Transactional emails are a topic to be covered all by itself in the future, but for now I recommend reading through the excellent documentation by [Sendgrid](https://sendgrid.com/docs/for-developers/sending-email/django/) and how to use their service with Django. The nice thing about Sendgrid is that they have a free plan which includes 100 emails per day forever, which is more than enough for initial testing. 

### Make the URLs go through

In your central app's *urls.py* file, add the Allauth URLs under the *accounts/* prefix:

```python
urlpatterns = [
    # ...
    path('accounts/', include('allauth.urls')),
    path('users/', include('users.urls')),
    # ...
    ]
```



## Put it all together: the templates

The main work will happen in our *_base.html* template file within the *pages* app (following my guide on creating a separate *pages* app for common static and layout files). In the base template, you can decide where to place buttons for login, sign up, etc. and also decide how to greet logged in users. A simple Bootstrap navbar could look like this:

```html
<nav class="navbar navbar-expand-md">
    <div class="collapse navbar-collapse" id="navbarNav">
        <div class="navbar-nav ml-auto">
            {% raw %}{% if user.is_authenticated %}{% endraw %}

            <div class="dropdown mr-3 d-none d-md-block">
                <a class="dropdown-toggle avatar-btn" href="#" role="button" id="userMenuDropdownLink"
                   data-toggle="dropdown"
                   aria-haspopup="true"
                   aria-expanded="false" aria-label="User menu">

                    {% raw %}{% if user.profile_images.last.image %}{% endraw %}
                    <img class="avatar" src="{% raw %}{% get_media_prefix %}{{ user.profile_images.last.image }}{% endraw %}"
                         alt="User avatar"/>
                   {% raw %} {% else %}{% endraw %}
                    <span class="avatar-placeholder avatar">{% raw %}{% if user.first_name %}
                            {{ user.first_name|slice:":1" }}{{ user.last_name|slice:":1" }}
                        {% else %}{{ user.email|slice:":2" }}{% endif %}{% endraw %}
                    </span>
                    {% raw %}{% endif %}{% endraw %}
                </a>
                <div class="dropdown-menu dropdown-menu-right" aria-labelledby="userMenuDropdownLink">
                    <h3 class="dropdown-header font-weight-bold">Hi
                        {% raw %}{% if user.first_name %}{{ user.first_name }}{% else %}{{ user.email }}
                        {% endif %}{% endraw %}</h3>
                    <a class="dropdown-item" href="">My Trips</a>
                    <a class="dropdown-item" href="{% raw %}{% url 'user_profile' user.url_short %}{% endraw %}">My Profile</a>
                    <div class="dropdown-divider"></div>

                    <a class="dropdown-item" href="{% raw %}{% url 'account_logout' %}{% endraw %}">Log out</a>
                </div>

                {% raw %}{% else %}{% endraw %}

                <a href="{% raw %}{% url 'account_login' %}{% endraw %}" class="btn btn-outline-primary mt-3 mt-md-0 ml-md-4">Log in</a>
                <a href="{% raw %}{% url 'account_signup' %}{% endraw %}"
                   class="btn btn-primary mt-3 mt-md-0 ml-md-3">Sign up</a>

                {% raw %}{% endif %}{% endraw %}
            </div>
        </div>
    </div>
</nav>
```

This code will check if a user is authenticated via the `{% raw %}{% if user.is_authenticated %}{% endraw %}` template tag. If yes, it will display the profile image which was uploaded last or, if no image exists, display a placeholder that contains the user's initials. If no, the code will display the buttons for logging in and signing up, which redirect to the standard Django-allauth views that handle login and signup.

The next steps of setting up the entire, proper base template and the templates for the views we have created earlier will be part of an upcoming blog post.
