// script.js

const moodGenres = {
    happy: 'pop',
    sad: 'acoustic',
    relaxed: 'chill',
    energetic: 'dance',
    calm: 'ambient',
    party: 'party',
    romantic: 'romance',
    workout: 'work-out'
};

async function generatePlaylist() {
    const mood = document.getElementById('mood').value;
    const playlistDiv = document.getElementById('playlist');
    playlistDiv.innerHTML = 'Generating playlist...';

    // Ensure the selected mood has a corresponding genre
    if (!moodGenres[mood]) {
        playlistDiv.innerHTML = 'Invalid mood selected. Please try again.';
        return;
    }

    try {
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(spotifyConfig.clientId + ':' + spotifyConfig.clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        const response = await fetch(`https://api.spotify.com/v1/recommendations?seed_genres=${moodGenres[mood]}`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        const data = await response.json();
        const tracks = data.tracks;
        const trackURIs = tracks.map(track => track.uri);

        playlistDiv.innerHTML = '<h2>Playlist:</h2>';
        tracks.forEach(track => {
            const trackElement = document.createElement('p');
            trackElement.textContent = track.name + ' by ' + track.artists.map(artist => artist.name).join(', ');
            playlistDiv.appendChild(trackElement);
        });

        document.getElementById('addToSpotifyButton').style.display = 'inline-block';
        window.generatedTrackURIs = trackURIs;

    } catch (error) {
        console.error('Error generating playlist:', error);
        playlistDiv.innerHTML = 'Failed to generate playlist. Please try again later.';
    }
}

async function addToSpotify() {
    const trackURIs = window.generatedTrackURIs;
    const userAccessToken = await getUserAccessToken();

    if (!userAccessToken) {
        alert('Failed to get access token. Please try again.');
        return;
    }

    const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization': 'Bearer ' + userAccessToken
        }
    });
    const userData = await userResponse.json();

    const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + userAccessToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'Moodlist Playlist',
            description: 'Playlist generated based on your mood',
            public: false
        })
    });

    const playlistData = await playlistResponse.json();

    await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + userAccessToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uris: trackURIs
        })
    });

    alert('Playlist added to your Spotify account!');
}

async function getUserAccessToken() {
    const clientId = spotifyConfig.clientId;
    const redirectUri = spotifyConfig.redirectUri;
    const scopes = 'playlist-modify-private playlist-modify-public';

    // Check if access token is already in URL
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    let accessToken = params.get('access_token');

    if (!accessToken) {
        const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
        window.location = url;
    }

    return accessToken;
}
