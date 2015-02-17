SRCS += index.html manifest.webapp LICENSE js/app.js js/WISPr.js style/* img/icons/*.png

all:
	zip -r package.zip $(SRCS)

clean:
	rm package.zip
