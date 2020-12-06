DEST?=dist
ENV?=dev
dev:
	node_modules/.bin/vue-cli-service serve src/main.ts --open --proxy-env=${ENV}

clear:
	rm -rf ${DEST}/*

build: clear
	node_modules/.bin/vue-cli-service build src/main.ts --dest ${DEST}

lint:
	node_modules/.bin/vue-cli-service lint src/main.ts

install:
	yarn --registry=https://registry.npm.taobao.org

tar:
	tar --exclude="dist/.DS_Store" -zcvf alarm-fe-$(shell git describe --tags --long)-$(shell date "+%Y%m%d").tar.gz dist

ftp:
	ncftpput 192.168.31.84 /packages/newlook alarm-*.tar.gz
