[![status: archive](https://github.com/GIScience/badges/raw/master/status/archive.svg)](https://github.com/GIScience/badges#archive)

# Measures REST OSHDB App

## Monitoring and restarting

In order to monitor and/or restart the services, please login via ssh and then execute the `measures` command, which will make you being logged in as the `measures`.  Then, you are able to monitor the services via `pm2 list` and restart services via `pm2 restart [id of the service]` or even `pm2 restart all`.

## Installation

In the following, you will find a description of how to install the software on an exemplary server.  You might have to adjust the following commands in case of your own server.  The description includes the following software projects:

* measures-rest-oshdb-app
* measures-rest-oshdb-docker
* measures-rest-sparql

### Basic tools

```bash
sudo apt-get install -y autojump htop unzip
echo ". /usr/share/autojump/autojump.bash" >> ~/.bashrc
```

### sftp

```bash
sudo addgroup [your username] sftp-sshallowed
```

### Docker

```bash
sudo apt-get update
sudo apt-get install \
  apt-transport-https \
  ca-certificates \
  curl \
  software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) \
  stable"
sudo apt-get update
sudo apt-get install -y docker-ce

sudo curl -L https://github.com/docker/compose/releases/download/1.19.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

newgrp docker
```

### Create new user

```bash
sudo adduser --disabled-password measures
sudo usermod -a -G sudo -G docker measures
echo "alias measures=\"sudo su -l measures\"" >> ~/.profile
source ~/.profile
measures
```

### Nodejs and pm2

```bash
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo npm install pm2 -g
sudo pm2 startup
exit
# execute the command given in the result
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u measures --hp /home/m/measures
measures
```

### Install nginx

```batch
sudo apt-get install -y nginx
sudo service nginx status
sudo rm /etc/nginx/sites-available/default
sudo rm /etc/nginx/sites-enabled/default
```

### Let's Encrypt

```bash
sudo apt-get update
sudo apt-get install -y software-properties-common
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install -y certbot python-certbot-nginx

sudo iptables -I INPUT -p tcp -m tcp --dport 80 -j ACCEPT
sudo certbot --nginx --email mocnik@uni-heidelberg.de --agree-tos -n -d osm-data-quality.geog.uni-heidelberg.de -d osm-measure.geog.uni-heidelberg.de -d osm-measure-edit.geog.uni-heidelberg.de -w /var/www/html
#sudo certbot certonly --standalone --preferred-challenges http --email mocnik@uni-heidelberg.de --agree-tos -n -d osm-data-quality.geog.uni-heidelberg.de -d osm-measure.geog.uni-heidelberg.de -d osm-measure-edit.geog.uni-heidelberg.de -w /var/www/html
#  --staging
sudo shutdown -r now
```

Then use `crontab -e` to add:

```
14 3 * * * certbot renew --post-hook "service nginx restart"
```

### Firewall

```batch
sudo iptables-unblocktcp 80 global
sudo iptables-unblocktcp 443 global
```

### Configure nginx

Create a file `/etc/nginx/sites-available/https-redirect` (via `sudo vi`) with the following content:

```
server {
  listen 80;
  listen [::]:80;

  server_name osm-measure-edit.geog.uni-heidelberg.de;

  location ^~ /.well-known/acme-challenge/ {
    default_type "text/plain";
    root /var/www/html/;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}
```

Create a file `/etc/nginx/sites-available/osm-measure-edit` (via `sudo vi`) with the following content:

```
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;

  server_name osm-measure-edit.geog.uni-heidelberg.de;

#  ssl_certificate /etc/letsencrypt/live/osm-data-quality.geog.uni-heidelberg.de/fullchain.pem;
#  ssl_certificate_key /etc/letsencrypt/live/osm-data-quality.geog.uni-heidelberg.de/privkey.pem;

  location / {
    proxy_pass http://localhost:2999;
  }
}
```

Then:

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/https-redirect /etc/nginx/sites-enabled/https-redirect
sudo ln -s /etc/nginx/sites-available/osm-measure-edit /etc/nginx/sites-enabled/osm-measure-edit
sudo service nginx restart
```

### Measures-rest-oshdb

```bash
cd ~
git clone https://github.com/mocnik-science/measures-rest-oshdb-docker

cd ~
git clone https://github.com/mocnik-science/measures-rest-oshdb-app
cd measures-rest-oshdb-app && npm install
npm run build
pm2 start pm2/osm-data-quality.geog.uni-heidelberg.de.yaml

cd ~
git clone https://github.com/mocnik-science/measures-rest-oshdb-app measures-rest-oshdb-app-develop
cd measures-rest-oshdb-app-develop && git checkout develop && npm install
pm2 start pm2/osm-data-quality.geog.uni-heidelberg.de.dev.yaml
PM2_HOME="/home/m/measures/" && pm2 save
```

copy the libs

### Data

```bash
mkdir ~/measures-rest-oshdb-data
mkdir ~/measures-rest-oshdb-data/dbs
mkdir ~/measures-rest-oshdb-data/public
mkdir ~/measures-rest-oshdb-data/users
```

### Measures REST SPARQL

To install the SPARQL endpoint, execute the following commands:

```bash
cd ~
sudo apt install python3-pip
git clone http://github.com/giscience/measures-rest-sparql
cd measures-rest-sparql && npm install
pm2 start pm2/measures-rest-sparql.yaml
PM2_HOME="/home/m/measures/" && pm2 save
```

### Default

In addition, the static website (including the acme challenge) using nginx:

```bash
mkdir -p ~/www/osm-data-quality.geog.uni-heidelberg.de
```

Then, the data needs to be copy to this directory.  Thereafter, create a file `/etc/nginx/sites-available/osm-data-quality` (via `sudo vi`) with the following content:

```
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  listen 443 ssl http2 default_server;
  listen [::]:443 ssl http2 default_server;

  server_name osm-data-quality.geog.uni-heidelberg.de;

  location ^~ /.well-known/acme-challenge/ {
    default_type "text/plain";
    root /var/www/html/;
  }

#  ssl_certificate /etc/letsencrypt/live/osm-data-quality.geog.uni-heidelberg.de/fullchain.pem;
#  ssl_certificate_key /etc/letsencrypt/live/osm-data-quality.geog.uni-heidelberg.de/privkey.pem;

  root /home/m/measures/www/osm-data-quality.geog.uni-heidelberg.de;
}
```

Then:

```bash
sudo ln -s /etc/nginx/sites-available/osm-data-quality /etc/nginx/sites-enabled/osm-data-quality
sudo service nginx restart
```

### Publish the measures

Create a file `/etc/nginx/sites-available/osm-measure` (via `sudo vi`) with the following content:

```
server {
  listen 80;
  listen [::]:80;

  server_name osm-measure.geog.uni-heidelberg.de;

  location ^~ /.well-known/acme-challenge/ {
    default_type "text/plain";
    root /var/www/html/;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:31415;
  }
  location /sparql {
    proxy_pass http://127.0.0.1:8000;
  }
  location / {
    return 301 https://$host$request_uri;
  }
}
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;

  server_name osm-measure.geog.uni-heidelberg.de;

#  ssl_certificate /etc/letsencrypt/live/osm-data-quality.geog.uni-heidelberg.de/fullchain.pem;
#  ssl_certificate_key /etc/letsencrypt/live/osm-data-quality.geog.uni-heidelberg.de/privkey.pem;
  
  location ~ "^/user/([0-9]{5})/" {
    rewrite ^/user/([0-9]+)/(.*) /$2 break;
    proxy_pass http://127.0.0.1:$1;
  }
  location /api/ {
    proxy_pass http://127.0.0.1:31415;
  }
  location /sparql {
    proxy_pass http://127.0.0.1:8000;
  }
  location / {
    proxy_pass http://127.0.0.1:2999/repository/;
  }
}
```

Then:

```bash
sudo ln -s /etc/nginx/sites-available/osm-measure /etc/nginx/sites-enabled/osm-measure
sudo service nginx restart
```

## Author

This software is archived at HeiGIT gGmbH and not further maintained.

In 2018–2019, this software has been developed and maintained by Franz-Benjamin Mocnik, <mocnik@uni-heidelberg.de>, GIScience Research Group, Institute of Geography, Heidelberg University. The development has been supported by the DFG project *A framework for measuring the fitness for purpose of OpenStreetMap data based on intrinsic quality indicators* (FA 1189/3-1).

(c) by Heidelberg University, 2018–2019.

## License

The code is licensed under the [MIT license](https://github.com/giscience/measures-rest-oshdb/blob/master/LICENSE).
