---
title: Setting up Postgresql for Django 
subtitle: (on Heroku)
excerpt_separator: <!--more-->
tags: [Django, Python, SQL]
---

## Context
In previous posts, I describe the first steps in developing a rapid prototype by using Python-based Django web framework. One of the major components in any web app is the database to store your data. While Django supports numerous databases, both relational (native) and document-oriented (through community extensions), and makes them easily handable through a comprehensive adapter, <!--more-->it also works simply with SQLite. In fact, the standard setup of Django comes with SQLite has the default option, which is great for getting started and playing around.However, for production you might want something more scalable in the long-term. So which database to pick? When it comes to relational databases, my choice is Postgresql (psql) for a few simple reasons. First, it remains  open source, meaning you will still be able to use it freely if your prototype ever makes it into a commercial product. Second, it has a very active community around it, which means support and help if you get stuck is only a StackOverflow question away. Third, it is readily available on Heroku as a managed service, which, of course, is a nice bonus when you decided to go for Heroku as your platform. 

## Let's get started

Following good software engineering practices, we want our local development environment to resamble the remote deployment environment as closely as possible. Heroku currently runs psql 12.1 on newly created databases. Thhis means our local psql version should also be 12.1. First, check your current version by typing `which psql` into your terminal. This will tell you whether you have psql installed (in which case a path to the binary will be returned) or not (in which case `psql not found` will be returned). If you have psql installed, check the version by typing `psql --version`. Now if the terminal returns anything but 12.1, you will have to upgrade to the correct version.

The follwing steps describe how to get the correct version on MacOs. Should you use Linux, this will differ and you have to check how to do this with your respective package manager. For Ubuntu, add the psql package repository follwing [these instructions](https://wiki.postgresql.org/wiki/Apt).

In my case, I previously installed psql via Homebrew (brew), and my current version is 11.6:

```shell
psql --version
# psql (PostgreSQL) 11.6
```

Executing `brew list` actually shows that I deliberately installed psql 11, as the command shows the package 'postgresql@11'. Postgresql 12 is actually available as the brew package simply called 'postgresql'. To install the latest version, I first upgrade brew to the latest release, then install the postgresql package, and finally make sure the correct version is symlinked.

```shell
brew update # Makes sure brew is up-to-date and has all the latest versions
brew upgrade postgresql # If you don't have psql installed, use 'brew install postgresql' instead
psql --version # Returns psql (PostgreSQL) 11.6
brew unlink postgresql@11 # Skip this if you have no other version of psql installed
brew link postgresql
psql --version # Returns psql (PostgreSQL) 12.1
brew postgresql-upgrade-database

```

For anyone new to using a Uni-based oeprating system, and/or the terminal, you might ask yourself what the last three steps are for. Essentially, we are telling the system which version of a package we want to use by default by creating shortcuts for it. These shortcuts are called 'symlinks' [(more on symlinks)](https://devdojo.com/tutorials/what-is-a-symlink). By using `brew unlink`we first remove all the shortcuts for psql 11 from the system, and then create new ones for the up-to-date package by using `brew link`. Finally, when updating from one major release to another (11 to 12 in this case), we need to tell brew to migrate the data directory to the new version by running `brew postgresql-upgrade-database`.

Nice, we now have psql installed on our system. Let's move on to actually creating the database we need for our Django App.

Tip: Both, `brew upgrade postgresql`and `brew install postgresql` will install the latest release of psql available in Homebrew. Should the siutation arise that you need an older version (e.g. because Heroku or your provider of choice still uses an older version), install that older version by appending it with an '@', for example version 12 of psql like this `brew install postgresql@12`.


## Create the database

If you paid attention durin the brew install of psql, you saw the following output at the end of the installation process, which tells you how to run the service:

```
To have launchd start postgresql now and restart at login:
  brew services start postgresql
Or, if you don't want/need a background service you can just run:
  pg_ctl -D /usr/local/var/postgres start
```

Let's make sure that worked and psql is in fact running by typing `ps aux | grep postgres` into our terminal. `ps aux` returns a list of all running processes on your machine. Since that list most likely is very long and hard to search through, we are usung [grep](https://de.wikipedia.org/wiki/Grep) to filter the result of the ouput to the specified search term 'postgres'. This should return a much smaller list of processes. If nothing is returned, no process containing the term 'postgres' is currently running. In this case, try to start the service again with the second command (`pg_ctl ...`). That one should give you a clear error message on what's wrong if starting the service fails. 


Now let's use the psql command line to access your database server

```shell
psql
```

You are now inside psql's very own interactive terminal, meaning you can execute psql-specific commands and actually also query tables you have created. Let's do this step by step:

### Create a user

```sql
CREATE USER simon WITH PASSWORD '<your secure password>'
```

Pick any user name for now, since this is a development environment. However, I do recommend you get into the habit of using save passwords **everywhere**. So generate a random one, and make it long! `\du` will output a list of existing users, verify that the one you just generated is among them!

### Create the database and assign it to your user

```sql
CREATE DATABASE magellandev WITH OWNER simon;
```

`\l` will output a list of existing databases, verify again.

Once you are done, quit the interactive terminal like this:

```shell
\q
```

Tip: Make sure to always end SQL statements with an ';' otherwise they won't execute.





### Plug database into your Django settings

At this point, we will make our life as easy as possible. Remember, we want to follow strict security protocol, and make our development and production envrionments as similar as possible. Regarding the database, we achieve this by using the 'dj-database-url' package. It allows us to specify all parameters for the database in a single URL string, which of course we store as an environment variable in our local `.env` file, since it contains sensitive information including the password. 

Make sure you instaled the package with pip or do so now:

```python
pip install dj-database-url
pip freeze > requirements.txt
```

Save the environment variable according to the following template:

```
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<name>
```

Given my example above, this would be postgres://simon:\<password\>@localhost:5432/magellan-dev. Note that the standard postgres port is 5432.

Now, all we have to do is adjust our `settings.py` file by making sure the import of the package is there, and further down we add the short handle that the package provides us. This will automatically pickup the URL from the `DATABASE_URL` variable we set and will break it down into all the individual settings Django expects.

```python
[...]
import dj_database_url
[...]
DATABASE_URL = config('DATABASE_URL') 
# We are using decouple to pick up envrionment variables from an .env file. 
# Make sure to set this variable, otherwise your local app will not pick up the correct database URL

[...]

DATABASES = {'default': dj_database_url.parse(DATABASE_URL, conn_max_age=500)}

```

We just made sure that our database connection information is stored securely. But using the `dj-database-url` package has the additional benefit of also helping us out with Heroku. Using the settings as specified above, all we need to do on Heroku is provision a postgresql add-on (through the command line or the web interface) and Heroku will automatically set the necessary environment variable, which then will be picked up by our Django app. No need for user or password creation, no need to update anything. It just works. Very nice. 

## Let's test it

There is only one step missing. We need to test whether all the stuff we did actually works. So let's try to migrate our database in Django:

```shell
python manage.py makemigrations
python manage.py migrate
```

Ideally, we will now see all our migrations being applied. Don't worry if you encounter errors, though. We did quite some work, so there might have been a typo at some point, or other errors. Make sure you actually created the database user and table (see above, using `\du` and `\l` to verify), set the environment variable  with all information in the URL, and also set up the `settings.py` file correctly. 

