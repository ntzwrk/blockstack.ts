/*
 * Here comes the fun. Have some, now!
 */


/**
 * Returns a random positive adjective
 */
export function correct(): string {
	const adjectives = [
		'amazing',
		'delicious',
		'enjoyable',
		'exquisite',
		'fantastic',
		'great',
		'happy',
		'incredible',
		'pleasant',
		'marvelous',
		'memorable',
		'remarkable',
		'satisfying',
		'superb',
		'sweet',
		'very good',
		'wonderful',
		'<3'
	];

	return adjectives[Math.floor(Math.random()*adjectives.length)];
}

/**
 * Returns a random negative adjective
 */
export function incorrect(): string {
	const adjectives = [
		'bad',
		'bogus',
		'faulty',
		'foolish',
		'inaccurate',
		'incorrect',
		'laughable',
		'only half-baked',
		'stupid',
		'totally mistaken',
		'WRONG',
		':('
	];

	return adjectives[Math.floor(Math.random()*adjectives.length)];
}
