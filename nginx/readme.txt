1. Nginx安装
(1)确认是否已安装，如已安装则跳过
/usr/local/nginx/sbin/nginx -V
(2)安装依赖包
sudo apt-get install openssl libssl-dev
sudo apt-get install libpcre3 libpcre3-dev
sudo apt-get install zlib1g-dev
(3)下载安装包
cd /usr/local/src
sudo wget http://nginx.org/download/nginx-1.17.5.tar.gz
(4)编译
sudo tar -xzvf nginx-1.17.5.tar.gz
cd nginx-1.17.5
sudo ./configure --prefix=/usr/local/nginx --with-http_ssl_module
sudo make
(5)安装
sudo make install
/usr/local/nginx/sbin/nginx -V

2. 获取证书
(1)certbot
https://blog.csdn.net/weixin_34192816/article/details/89543290
https://jianshu.com/p/4220bdbda0e1
(2) aliyun
https://common-buy.aliyun.com/?commodityCode=cas#/buy
这里选用阿里云的个人免费证书，有效期1年。

3.Nginx.conf 配置
sudo vim /usr/local/nginx/conf/nginx.conf

使用以下反向代理配置
    server {
      listen       443 ssl;
      server_name  abtworld.cn;
  
      charset utf-8;
      ssl_certificate /home/ubuntu/abtworld/ssl/3232353_abtworld.cn.pem;
      ssl_certificate_key /home/ubuntu/abtworld/ssl/3232353_abtworld.cn.key;
      fastcgi_param   HTTPS               on;
      fastcgi_param   HTTP_SCHEME         https;
 
      access_log      /var/log/nginx/www.abtworld.cn.access.log;
      error_log       /var/log/nginx/www.abtworld.cn.error.log;
      location / {
        # default port, could be changed if you use next with custom server
        proxy_pass http://localhost:3030;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # if you have try_files like this, remove it from our block
        # otherwise next app will not work properly
        # try_files $uri $uri/ =404;
      }
    }

    server {
      listen       80;
      server_name  abtworld.cn hashnews.cn;
      rewrite ^(.*)$ https://$host$1 permanent;
    }

4.关闭80/443端口转发
(1)列出规则，包括序号
sudo iptables -t nat -L -n --line-numbers
(2)根据序号删除(假如删除序号1)
sudo iptables -t nat -D PREROUTING 1
同时关闭~/.bashrc中的端口转发配置命令
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3030

5.启动nginx
sudo killall nginx
sudo /usr/local/nginx/sbin/nginx -t
sudo /usr/local/nginx/sbin/nginx -c /usr/local/nginx/conf/nginx.conf
如果启动失败，查看和释放80/443端口后再次启动
sudo netstat -lntp


