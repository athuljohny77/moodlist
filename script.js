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

function formatDate(date) {
    const options = { month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString(undefined, options);
    const hours = date.getHours();
    const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours % 12 || 12}:${minutes} ${ampm}`;
    return `${formattedDate}, ${formattedTime}`;
}

async function generatePlaylist() {
    const mood = document.getElementById('mood').value;
    const playlistDiv = document.getElementById('playlist');
    playlistDiv.innerHTML = 'Generating playlist...';

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

        if (!tokenResponse.ok) {
            throw new Error("Failed to get access token for generating playlist");
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        const response = await fetch(`https://api.spotify.com/v1/recommendations?seed_genres=${moodGenres[mood]}`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch recommendations");
        }

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
        window.selectedMood = mood;

    } catch (error) {
        console.error('Error generating playlist:', error);
        playlistDiv.innerHTML = 'Failed to generate playlist. Please try again later.';
    }
}

async function addToSpotify() {
    const trackURIs = window.generatedTrackURIs;
    const userAccessToken = await getUserAccessToken();
    const mood = window.selectedMood;
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate);

    if (!userAccessToken) {
        alert('Failed to get access token. Please try again.');
        return;
    }

    try {
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': 'Bearer ' + userAccessToken
            }
        });

        if (!userResponse.ok) {
            throw new Error("Failed to get user details");
        }

        const userData = await userResponse.json();
        console.log("User data retrieved:", userData);

        const playlistName = `Moodlist - ${mood.charAt(0).toUpperCase() + mood.slice(1)} (${formattedDate})`;
        const playlistDescription = `A ${mood} playlist generated on ${currentDate} | Moodlist - Created by Athul Johny © 2024`;

        const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + userAccessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: playlistName,
                description: playlistDescription,
                public: false
            })
        });

        if (!playlistResponse.ok) {
            throw new Error("Failed to create playlist");
        }

        const playlistData = await playlistResponse.json();
        console.log("Playlist created:", playlistData);

        const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + userAccessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: trackURIs
            })
        });

        if (!addTracksResponse.ok) {
            throw new Error("Failed to add tracks to playlist");
        }

        console.log("Tracks added to playlist:", await addTracksResponse.json());
        alert('Moodlist added to your Spotify account!');
    } catch (error) {
        console.error('Error creating playlist:', error);
        alert('Failed to create playlist. Please try again later.');
    }
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
