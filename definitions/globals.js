if (RELEASE) {
	PAUSESERVER('database', true);
	setTimeout(() => PAUSESERVER('database', false), 2000);
}