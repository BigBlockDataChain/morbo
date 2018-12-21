default:
	make -j2 _all

_all: _tsc _serve

_tsc:
	npm run tsc

_serve:
	@sleep 3 # Give TypeScript some time to get started
	npm run serve
