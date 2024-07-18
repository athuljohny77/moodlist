// getUserAccessToken.js

const spotifyConfig = {
    clientId: '1008dc2ab8e5414796ea75fe9108dc41',
    redirectUri: 'https://athuljohny77.github.io/moodlist', // Your GitHub Pages URL
    scopes: 'playlist-modify-private playlist-modify-public'
};

function getUserAccessToken() {
    const params = new URLSearchParams(window.location.hash.substring(1));
    let accessToken = params.get('access_token');

    if (!accessToken) {
        const url = `https://accounts.spotify.com/authorize?client_id=${spotifyConfig.clientId}&response_type=token&redirect_uri=${encodeURIComponent(spotifyConfig.redirectUri)}&scope=${encodeURIComponent(spotifyConfig.scopes)}`;
        window.location = url;
    } else {
        window.history.replaceState({}, document.title, window.location.pathname); // Clean the URL
    }

    return accessToken;
}
