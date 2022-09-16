
async function fetchGQL(url: string, body: string): Promise<Response> {
    return fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: body
    });
}

export async function fetchQuery(url: string, body: string): Promise<Response> {
    return fetchGQL(url, JSON.stringify({query: `{ ${body} }`}));
}

export async function fetchMutation(url: string, body: string): Promise<Response> {
    return fetchGQL(url, JSON.stringify({query: `mutation { ${body} }`}));
}

