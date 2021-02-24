#!/bin/bash
sys_date=`date +%Y-%m-%d-%H-%M-%S`
backup_dir=mongodb-backup-$sys_date
echo $backup_dir
sudo mongodump -u admin -p 123456 -o $backup_dir
sudo tar -czvf ${backup_dir}.tar.gz $backup_dir
sudo rm -rf $backup_dir
