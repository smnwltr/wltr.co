# wltr.co
Personal Freelance Business Website

## Stack
Built using:
* Jekyll as static site generator
* Bootstrap as CSS framework
* jQuery to handle simple Bootstrap interactions
* Typed.js to add some flavor  https://github.com/mattboldt/typed.js/
* CSS Hamburgers menu by https://github.com/jonsuh/hamburgers

## Deploy
Deployed on simple web space via rsync
```
rsync -avP --delete-after --force --exclude '.ht*' -e ssh <source> <dest>
```
Note the exclusion of .ht* files to prevent deleting them on `<dest>`, allowing for dev deploy behind a simple htaccess password protection
