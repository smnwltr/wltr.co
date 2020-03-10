---
title: Deploying your Django app on Heroku
excerpt_separator: <!--more-->
tags: [Django, Python, Heroku]
---

## Context

One of the most exciting things while developing a prototype is actually getting to show it off to other people. Since doing so on your local device very much limits the audience for that, it is very important to quickly be able to have an online review  environment. With Django, you could of course get a server (with AWS, Azure, or whatever), install the correct Python and everythign else with it, <!--more-->configure environment variables, setup SSH, and so on. If you are a bit more experienced, you could of course set up a Docker container and then just push that container to your server.

However, in my experience the fastest and least complicated way to get your Django app published, is with Heroku. Not only do they have a mature Platform-as-a-Service product, but they also have a lot of resources on Python and Django in particular. Not least, there is also a good free option for small projects available, meaning you can test and play around without having to spend anything on it. Plus there are tons of other blog posts on how to deploy your Django app on Heroku, which is always an important point for beginners. So why add another guide since there are already a lot out there? When I started publishing some hobby projects on Heroku, I did struggle since there were some pitfalls in outdated blog posts, unclear instructions for me as a beginner, etc. So here I will just describe what in my eyes is the fastest way to publishing your app, in a beginner friendly way.


## Get ready

To follow along, you will need two things:

* A working Django app, even if it only returns the standard welcome page. Make sure you manage dependencies with pip and created a requirements.txt file with `pip freeze > requirements.txt` in your project root folder.

* A (free) Heroku account. Go to [heroku.com](https://heroku.com) to get one.


### Django project preparations

In your Django code base, you will need to take a couple of steps to make your app ready for Django. First, I strongly recommend you put all sensitive information, as well as any variables that differ between your local and remote environments, into environment variables. There is a package called 'decouple' that helps you manage them centrally in a local .env file, [read detailed instructions here]({% link _posts/2019-11-21-django-set-up-for-magellan.md %}#env-variables).


Now, on to the packages you need to install.

First, get the django-heroku package:

```shell
pip install django-heroku
```

This package is actually not needed just to get started, but not far down the road you will find this helpful so I suggest to already add it to your project. Plus, it already handles the ALLOWED_HOSTS variable for you.

Next is 'gunicorn', a HTTP Server Heroku recommends with Django:

```shell
pip install gunicorn
```

Since we just installed two packages, make sure to update your requirements.txt:

```shell
pip freeze > requirements.txt # Assuming you are in your project's root folder
```

Heroko picks up your requirements.txt during deploy to install all packages, so make sure it is always up-to-date before deploying.

Next, we add another file that Heroku uses as input for building your server. By default, Heroku uses Python 3.6. Since we are using Python 3.8 (at least if you followed my other post), we need to tell Heroku to also use 3.8. We do so by providing Heroku a 'runtime.txt' file, also located in our project's root folder:

`echo 'python-3.8.1 > runtime.txt`

Now, update the settings.py to import the django-heroku setting which automates things such as ALLOWED_HOSTS and WhiteNoise (static files, not required now but likely in any app that you develop further):

```python
[...]
# Configure Django App for Heroku.
import django_heroku
django_heroku.settings(locals())
```
Add this code snippet all the way to the bottom of your settings.py file.


That is all we have to do in our code. At least as long as we do not have any static files or give users the option to upload their own files (such as profile pictures). For that, we need to work with Django's static file handling, and set up a file storage server. I will cover that in a later post. 



### Creating the app on Heroku.com

There are two ways of doing this. One is doing it entirely via the terminal, using the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli), or via the web interface at the [Heroku Dashboard](https://dashboard.heroku.com). To further our mastery of the terminal, let's do this via the terminal. The workflow in the web interface is neat and self-explanatory, if you go to the dashboard and follow the steps I describe below.

First, we need to create the app in Heroku:

```shell
heroku create <your app name>
```
This will only work if the app name you pass to the command has not been taken yet. Your app will later be available at \<your app name\>.herokuapp.com, so it has to be unique. If you are just testing things out, or really don't care because you will point your own domain at the .herokuapp.com URL, just run `heroku create`and Heroku will choose a random name for you.


Note: Make sure to create the app while in the project's root folder. Heroku will pick up the Git repository and all following Heroku commands will automatically be run against the correct app (assuming you have more than one in Heroku). If you do not do that, you will later have to specifiy the app you are targeting by appending `-app <your Heroku app name>` every time you run a Heroku command.

Next, we want to make sure to set a couple of environment variables that Django needs:

```shell
heroku config:set DEBUG=False --app <your app name>
```
Always set DEBUG to false when running the app on a publicly available server! Otherwise you risk serious security issues.

```shell
heroku config:set ENVIRONMENT=Staging --app <your app name>
```
Later on, having this variable will make it easy to adjust certain settings (like static files) based on the environment the app is running in.

```shell
heroku config:set DISABLE_COLLECTSTATIC=1 --app <your app name>
```
So far, we are just playing around and making sure the app deploys, so we don't want Heroku to go looking for static files, since there are none, and the app will crash if it tries to find them.

```shell
heroku config:set SECET_KEY=<your secret key>
```
Django requires the secret key to be set, and will not start up if you don't. Generate a random key, and to reiterate, never share it somewhere it doesn't belong (code base, Git!). 


### It's time to deploy!

Now on to the exciting part. Don't be afraid, this is the easiest part, and one of the reasons I like Heroku so much. Deploying really could not be easier.

Again, there are two ways to achieve what we want, one via the web interface, one via the terminal. This time however, I recommend going via the web interface, at least if you host your repository on GitHub. Heroku has a direct integration with GitHub, which actually entirely automates deployment. 

Go to your app and access the 'Deploy' tab (the link looks like *https://dashboard.heroku.com/apps/\<your app name>/deploy*). Once there, you can give Heroku access to your GitHub account, and then, a bit further down the page, hook up the respective Git repo to this app. Once done, you can pick a branch and *Enable Automatic Deploys*, which will trigger a new build every time that branch is pushed to. Generally, I have three branches: *develop*,*staging*, and *master*. The first one is for everything local on your machine, the last one is the production branch which you can use later once you release your app. So, that leaves *staging*, which I use for deploying to the Heroku branch that I make available for people to review my app. For a bit more control, you can also manually deploy branches, which is what you might try right now and see how it goes. Select the most recent branch that has the changes described in the first part of this post. Heroku will let you know if the build and release was succesful or not.

The second option works with **any** Git repo, not just GitHub, which makes it of course a bit more flexible. 

All you have to do is create a remote branch for your repo on the Heroku Git server:

```shell
heroku git:remote -a <your app name>
```
Here, we do need to specifiy an app name so make sure to include the -a (or --app) flag and your app's name.

Once done, you can manually push to that remote:

```shell
git push heroku master
```
Note that this will push your local branch to Heroku's master branch. You always want to push to Heroku's master since that is the branch it will use to deploy your app. If you want to push another local branch (such as staging, develop, or whatever branch you have), do the following:

```shell
git push heroku staging:master
```
This will push your local staging branch to be deployed on Heroku.


### Did we forget something?

To make full use of your app, you will want to access the Django admin panel at some point. In order to do so, you will need a super user. Create it by running the following command:
```shell
heroku run python <your app name>/manage.py createsuperuser
```
Remember that the manage.py file is located one level down from your project's root folder, so you will have to specify the correct path for it!


One last thing: You might wonder why we did not even bother to create a database? The short answer is: Heroku does it for you! Heroku automatically provisions a hobby-dev (their name for the free tier) database for you. And since we are using the DATABASE_URL variable, you don't need to do anything for your app to connect to the database. How sweet is that?!?
