---
title: Making the first design steps in Django
tags: [Django,Python,AWS,Sass]
---

## Context
After setting up the basic project structure and creating an online staging environment on Heroku that we can deploy to, it is now time to set up the first pages of our app. This includes the overall landing page visitors see when accessing the app for the first time, and the dashboard that logged in users see when they start using the app. 

## Let's get started

Create the app from your Django folder (second level down):

```shell
django-admin startapp pages
```
Note: *django-admin* is a command line shortcut that does the same as `python manage.py ...`.

Once the app has been created, we need to add at least one view in our *views.py* file:

```python
from django.views.generic import TemplateView


class Home(TemplateView):
    template_name = 'home.html'
```

Now let's add the app to the INSTALLED_APPS object in our *settings.py* file so that Django knows it exists:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Proprietary
    'pages.apps.PagesConfig',
]
```



## Creating templates

As you may have noted above in our *views.py* file, we are telling Django to return a *TemplateView*. For that to actually work, we need to setup templates.

We will manage templates at a central folder inside your Django folder:

```shell
mkdir templates && cd templates
```

Now, let's create two files:

```shell
touch _base.html
```
This file will hold the scaffold of our app. Things like the navbar, footer, etc.

```shell
touch home.html
```
Here we will put the actual content for our home page.

Django automatically picks up template files located inside of the *templates* directory within each app in your project. This is controlled by the *TEMPLATES* object within settings, and works as long as the *APP_DIRS* key is set to True. You may specify additional directories that contain templates by adding to the list at the *DIRS* key.

As to the actual layout, I will not go into detail here. Personally, I am using [Bootstrap](https://getbootstrap.com), since that's what I'm most familiar with and what will get me results fast. In general, you will need to have some CSS and most likely also some JavaScript in your app. To achieve that with Django, we need to manage static files.

## Static files

Static files are easy to handle locally with Django. Each time you execute the `runserver` command, they are served for you locally. On remote servers, we need to find a more efficient solution. There are essentially three ways:
1. Pushing the files to an Apache or nginx server you control by yourself
2. Using a package such as boto3 and django-storages that interface to AWS S3
3. Make it realy simple and use Whitenoise, a package designed to serve static files in place for you. 

Since Whitenoise has been giving me quite some issues lately, and because we will need it for media files (uploaded by users) later on anyways, we will go with AWS S3. 

### AWS S3 bucket

There are a lot of resources online on how to set up S3 buckets. One tutorial I used in the past is available on [simple is better than complex](https://simpleisbetterthancomplex.com/tutorial/2017/08/01/how-to-setup-amazon-s3-in-a-django-project.html), the aforementioned excellent blog on Django by Vitor Freitas.

### Django code prep

First, let's install the packages we need:

```shell
pip install boto3 django-storages
pip freeze > requirements.txt
```

Then, in *settings.py*, let's include all variables we need for S3:

```python
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
AWS_DEFAULT_ACL = None
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET')
AWS_S3_CUSTOM_DOMAIN = '%s.s3.amazonaws.com' % AWS_STORAGE_BUCKET_NAME
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}
AWS_LOCATION = 'static'
```
Make sure to set the three environment variables in your *.env* file. 

Now all we have to do is make sure that we specify a *STATIC_URL* and the correct storage backend (via *STATICFILES_STORAGE*) depending on the environment:

```python
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

if ENVIRONMENT == 'Development':
    STATIC_URL = '/static/'
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'
elif ENVIRONMENT == 'Staging':
    STATIC_URL = 'https://%s/%s/' % (AWS_S3_CUSTOM_DOMAIN, 'static')
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'sass_processor.finders.CssFinder',
]
```

Notice we also told Django where to find static files. The finder we specified will look up all */static/* directories within each of our separate app directories, e.g. *pages/static/*.

For testing, go ahead and comment out the `if` statement and set `STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'`. Now when reunning `python manage.py collectstatic`, your app should transfer all static files up to S3. Don't worry if it takes a while, that's normal. Check the S3 console to locate your files. 


## Sass

This is completely optional, but if you ever used Sass before, you will want to use it. Because it's just such a great enhancement for CSS. If you haven't, go and checkout [https://sass-lang.com/](https://sass-lang.com/). It gives you a set of great new features such as defining variables and allowing for intelligent nesting of properties. 

Let's do it:
```shell
pip install libsass django-compressor django-sass-processor
pip freeze > requirements.txt
```

Add the package to the *INSTALLED_APPS* object in *settings.py*:

```python
INSTALLED_APPS = [
[...]

    # Vendor
    'sass_processor',

[...]

]
```

And finally, add it to the *STATICFILES_FINDERS object:

```python
STATICFILES_FINDERS = [
        [...]
        'sass_processor.finders.CssFinder',
]
```

That's it. Now all *.scss* files should be compiled when running `collectstatic` or `runserver`. More infos on the package can be found [here on it's GitHub repository](https://github.com/jrief/django-sass-processor).

Note: Setting up SCSS with Heroku can be a bit more tricky, since you have to make sure Sass is compiled first, and only then static files are collected.

One option to make sure this happens in the correct order is setting the `DISABLE_COLLECTSTATIC` variable to true in your app's dyno:

```shell
heroku config:set DISABLE_COLLECTSTATIC=1
```

Then, you need to tell Heroku to run the correct commands in the right order. One way to do so is by using a second *buildpack* for this special case, which is available [here](https://elements.heroku.com/buildpacks/drpancake/heroku-buildpack-django-sass#buildpack-instructions).

There are other ways, like adding the commands to your Procfile's release phase, for example. Also, should you ever realize that the SCSS file has not been compiled and/or served correctly, you can run the commands manually:

```shell
heroku run python manage.py compilescss
heroku run python manage.py collectstatic --noinput
```

## Central App Data
In my apps, I like to manage some static data that I use across the code base centrally as variables. For example, a support e-mail address that appears on various pages, links to certain static pages, even the name of my app. If I store that information in a central file, I can refer to it from many places across the code and when it changes, I only have to update it in one place. That way you don't end up with old, invalid e-mail addresses that are hidden somewhere and you forgot to update them because they are hardcoded. A problem that, in some variation, many of us might have encountered before.

So go to the third level app folder, in my case that would be *magellan/magellan/magellan*, and create file *data.py*, which contains a function that returns a dictionary containing all the variables you want to set:

```python
def app_data(request):
    data_dict = {
        'app_name': 'Magellan',
        'contact': {
            'support': 'smn@wltr.co',
            'phone': '+49 89 1234 5678',
            'street': 'Some street 51',
            'city': 'Munich',
            'country': 'Germany',
        },
        'static_links': {
            'privacy': '/privacy/',
            'imprint': '/imprint/'
        }
    }
    return data_dict
```

Now, we have to make sure Django picks up these variables inside our templates. All we need for that is adding one line to our *settings.py* file. Morep precisely, we add the file to the *TEMPLATES* list as a context processor:

```python
           'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'magellan.data.app_data',
            ],
```

That's all there is to it. Now, in your templates, simply call your app's name by adding `{{ app_name }}` whereever you want it to appear.



## Managing URLs
To make sure Django knows what page to return when people enter a specific URL, we need to create a *urls.py* file in our *pages* app:
```shell
cd pages
touch urls.py
```


We will include this URL file (and with it all URL patterns it contains), at our main *urls.py* that is located within our project's app folder (the third level down). This means we can now delete the function we created earlier that responds a simple text when accessing our app's front page. 

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('', include('pages.urls')),
    path('admin/', admin.site.urls),
]
```

Now, all URLs that we specify in our *pages* app, will be picked up by Django. 

While we are at it, let's add a bit of code that prevents our app being indexed by Google and other search engines when we publish it to people just for reviewing purposes. This means, no one can find the app without knowing its specific URL. We do so by having Django return a response whenever search engines try to access the *robots.txt* file, which controls access to our site for search engine crawlers:

```python
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import HttpResponse
from django.conf import settings

[...]

if settings.ENVIRONMENT == 'Staging':
    urlpatterns.append(re_path(r'robots.txt',
                               lambda request: HttpResponse("User-agent: *\nDisallow: /", content_type="text/plain"),
                               name="robots_file"))
```
