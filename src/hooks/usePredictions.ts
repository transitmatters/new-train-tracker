return fetch(`/routes/${routes.join(',')}`).then((res) => res.json());
