---
title: "Next steps: crispy forms and media upload"
tags: [Python, Django]
---

## Context
After having set up a good scaffold for our app, we want to take care of some under-the-hood basics we will need later on: making our forms look pretty and enabling our app to upload media (images, mostly) so that for example users can have their proper avatar image. 

## Crispy forms

Nothing easier than that. Simply install it via `pip` and add it to *settings.py*:

```shell
pip install django-crispy-forms
pip freeze > requirements.txt
```
Make sure you execute the above commands in your top level project folder, the one where the *requirements.txt* file should already be located.


Now, let's add the app to our *settings.py* and set the correct template pack, in our case bootstrap4.

```python
# settings.py

INSTALLED_APPS = [
    ...
    # Vendor
    ...
    'crispy_forms',
    ...
]

CRISPY_TEMPLATE_PACK = 'bootstrap4'

```
That's it. Once we create forms for users to interact with our app we will be able to render them nicely. Follow up on one of the next blog posts to see how.

## Media upload

First, when developing locally, we want the media files to be served locally as well. To do so, open your main *urls.py* (located inside the third level central app folder):

```python
from django.conf.urls.static import static
# ...
if settings.ENVIRONMENT == 'Development':
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

Inside that same third level central app folder, create a new file called *storage.py*. Here, we will keep the code that deals with different storage backends, since in the future we might want to add more options here, e.g. for private and public media assets, etc.:

```shell
touch storage.py
```

```python
from storages.backends.s3boto3 import S3Boto3Storage


class MediaStorage(S3Boto3Storage):
    location = 'media'
    file_overwrite = False
```



Finally, let's make sure Django knows what we want. Add the following variables to your *settings.py*:

```python
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

if ENVIRONMENT == 'Development':
    # ...
    MEDIA_URL = '/media/'
elif ENVIRONMENT == 'Staging':
    # ...
    DEFAULT_FILE_STORAGE = 'magellan.storage_backends.MediaStorage'
    MEDIA_URL = 'https://%s/%s/' % (AWS_S3_CUSTOM_DOMAIN, 'media')
```

And that's it. Now we want to test if our code is working. I will do so as part of my next post, which will describe how to create a custom user model for your app and which will feature a form that uploads a profile picture for each user.

