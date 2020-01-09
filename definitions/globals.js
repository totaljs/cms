if (RELEASE) {
	PAUSESERVER('database', true);
	setTimeout(() => PAUSESERVER('database', false), 3000);
}