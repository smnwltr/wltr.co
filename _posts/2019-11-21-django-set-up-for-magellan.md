---
title: Setting up Django for project Magellan
tags: [Django, Python]
---

## Context
Remember, the goal is to create a modern web app which allows for rapid prototyping and future scalability. We choose Django for reasons discussed in the last post (link below), and hence will walk through the steps to set up a new, clean project in Django. 

## The basics
### Git
First step in creating any new software project. Version control is an absolute must in software development and and an absolute essential skill for any developer. Read up on it and do online learnings on it, there is a ton of free resources. 

Choose your favorite provider, [GitHub](https://github.com), and [GitLab](https://gitlab.com) are two of the most widespread ones, both having plenty of free features for hobby or small projects. You can even host Git yourself and optionally also host a light-weight Git client such as [Gitea](https://gitea.io/).

Even better, you don't even have to use a remote, you may just use Git locally and never bother to push your changes to a remote server. This of course does not work if you want to collaborate or use Git branches to deploy your work to an online server. 

In my case, I used GitHub and created the repo online via the interface, then locally just did the following:

```shell
cd projects
git clone <your remote git server>/magellan.git
```
Bonus: When creating a repo via GitHub, you can use one of their template `.gitignore` files, in this case obviously the Python template (more on [gitignore](https://git-scm.com/docs/gitignore)).


### Venv
Not a common task with people used to Java, however in Python (or Ruby), it is common practice (and a good idea even for newcomers to get used to ), to use virtual environments for your Python or Ruby install. Essentially this lets you use a clean version of your programming language of choice , and most importantly, separate versions of both the language and whatever libraries you need for your project. For Python, there are two popular modules, [virtualenv](https://virtualenv.pypa.io/en/latest/) and [pipenv](https://pipenv.kennethreitz.org/en/latest/). There are good reasons for using either one, with pipenv claiming to be a bit modern, more integrated option, where venv is the older, more traditional approach. After having used both, I decided to go with virtualenv. Make up your own mind.


```shell
cd magellan
virtualenv venv
source venv/bin/activate
```

### Django
I like working with up-to-date software, so for this project, I will use Django 3 for the first time. After having activated your virtual environment, install Django via `pip install Django==3.0.3`. Now what does this do? Since we are inside our virtual environment (indicated by '(venv)' appended to the terminal), this will install Django for this particular virtual environment *only*, meaning in another virtual environment, I could install a different version of Django by specifying a different version number. 

Everytime you install a library via pip, you will want to freeze your requirements. Freezing your requirements creates a file containing a list with all the libraries you installed for your project. This is very handy, because when you deploy your project to a different machine, e.g. a remote server for staging or production, that machine can simply pick up the requirements.txt file and install all the listed requirements (you can also do this yourself on another machine by running `pip install requirements.txt`). Freeze your requirements with `pip freeze > requirements.txt` (using `>` will overwrite whatever is contained in the file with the output of `pip freeze`). At this point, your requirements.txt will contain Django plus some dependencies, which pip will automatically install for you.

Great, now we are ready to actually fire up our project. Django has a built-in script that will generate the basic files needed for any project. Run it in your project home directory like so `django-admin startproject <your project name>`.

A note on folder structure: The script we just ran creates a **Django** project folder named \<your project name\>, and within that an **app** folder also called \<your project name\>. This is standard since every Django project contains several apps (more on that later), with the *central* app having the same name as the project.This 'central' app as I called it contains some central files, such as the project's overall settings file and the central `urls.py` (more on that later). Now, both of these folders sit inside another folder also called \<your project name\>, meaning there are three folders all with the same name, which can be confusing. The top level *project* folder contains not only Django, but also other files, such as config files for pip, Heroku, the hidden .git folder, etc. These are independent of Django. So try to think of the structure as follows: **/Project/Django/App**

Django comes with a set of scripts for managing your app. To execute those, run the `manage.py` file located within your Django project folder (usually the second level down in your project folder, see above). The first thing to do a is to migrate the database via `python manage.py migrate` (make sure you specify the correct path to your manage.py). Next, you can run the app and make sure it is working. Django comes with a built-in local development server, simply start it up by running `python manage.py runserver`. You should now see your running app at http://localhost:8000/.

I'm not a big fan of the generic landing page, so instead we will instruct Django to return a custom string for us. Django decides what to return to the client based on the URL you enter in your browser. To control the response, go to your app folder named after the project, and open `urls.py`. Here, you can tell chango which view (or function) is to be returned at which URL. Later on, you will specifiy views here, but for now let's just tell Django to return a simple http response containing some random text.

```python
from django.contrib import admin
from django.urls import path
from django.http import HttpResponse #Add this import so that we can give a simple http response


# Define a function here using the HttpResponse module you just imported and specify any text as an argument
def index(request):
    return HttpResponse("Hello, world. This is Magellan!!")


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index, name='index') # Add this line to tell Django to return the function we just created at the 'home' path
]
```
Awesome! We have a working app that sends out responses. Now let's move on to bringing this online so we can show it to othre people.


### Env variables
This project will, in most parts, follow the recommendations of [Twelve-Factor App methodology](https://12factor.net/). One of the central points of 12Factor is separating config from code. This means, all sorts of config variables **must not be stored in the code base**. Ever hardcoded a password to a database or API inside the code? Big, big no-no. That's how secret information accidentially lands in the hands of other people who then might be able to access private data and siginificantly hurt your product. Never check sensitive information into version control also. Passwords, keys, and other config variables which change from instance to instance (local vs. remote, dev vs. staging) are best stored either as environment variables (differs by OS, check your preferred search engine) or in a file which then is read by your software. 

In Python, you maye use the built-in [os.environ](https://docs.python.org/3/library/os.html#os.environ) function, which we *could* also use for Django. However, there is a better solution available out there. By using python-decouple, we can make use of some nice features. First, we can store all of our variables in one single file called `.env`, located in our project root. So we can easily manage all our variables without fiddling with all these env variables on our machine. Further, python-decouple also allows us to set default values in our code if the variable is not set, and cast the simple text stored in our `.env` file to datatypes such as boolean, int, etc. which saves us trouble down the road.

So let's move to our project root folder and get to it:

```shell
pip install python-decouple
pip freeze > requirements.txt
echo 'SECRET_KEY=<your secret key\nDEBUG=True\nENVIRONMENT=Development' > .env
```
Notice the `\n` between our variables? This might look a bit confusing but it ensures that we insert new lines after each variable, since we do need to store each variable in its own line. An alternative to this last line would have been to split it up into one command per line and use the append operator `>>`

Now that we have the variables set, let's import them into our settings. Open the settings file located in your central app folder (see above), and first of all, delete the secret key after placing it in our `.env` file. Then, add or replace the following settings:

```python
...
from decouple, import config
...
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', cast=bool, default=False)
ENVIRONMENT = config('ENVIRONMENT')
...
```

Nice, we are now using the config variables stored in our `.env`file within the app settings.

## Database

Every app needs a database, but there are so many options... so which one should we pick here? First of all, Django does not officially support NoSQL databases. If you really wanted to go that way though, there are some forks that extend Django with respective engines. So looking at traditional databases, I usually go with Postgres, since it remains open source, has a huge community (read: get help easily), and it is supported well by Django. However, Django by default comes with SQLite as the standard data backend. And at some point I discovered that it's actually quite nice to just use that instead of having to make sure my postgres server was running, the connection works, and so on. ~~That's why I now use SQLite locally, while on my online staging environments on Heroku I use their built-in Postgres. This has worked very well so far, with no real issues and has saved me some local concerns. Should the need arise, there are ways to load a SQLite dump into Postgres, so there is a way out. Do note though, that my approach is not exactly 12Factor friendly, which states that you should eliminate such differences in an effort to guarantee smooth continuous deployment.~~~

Update: Shorty after writing this post, and while still working on the setup, I reconsidered my approach. While SQLite is nice and easy to handle, I believe it is important to follow best practice. Plus, this is a serious project, and I do want to make it future-proof. So I decided to actually go for it and install the same PostgreSQL version that Heroku is using and set up a local database with it. I wrote a full post on [how to install Postgres and use it in your Django/Heroku project here]({% link _posts/2019-11-28-setup-postgresql-for-django-heroku.md %}).


## Deploy (on Heroku)

#Todo: Write deploy blog post