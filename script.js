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
        window.selectedMood = mood;

    } catch (error) {
        console.error('Error generating playlist:', error);
        playlistDiv.innerHTML = 'Failed to generate playlist. Please try again later.';
    }
}

async function addToSpotify() {
    const trackURIs = window.generatedTrackURIs;
    const userAccessToken = getUserAccessToken();
    const mood = window.selectedMood;
    const currentDate = new Date().toLocaleString();

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
        const userData = await userResponse.json();

        const playlistName = `Moodlist - ${mood.charAt(0).toUpperCase() + mood.slice(1)} - ${currentDate}`;
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

        const playlistData = await playlistResponse.json();

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

        if (addTracksResponse.ok) {
            alert('Moodlist added to your Spotify account!');
        } else {
            console.error('Error adding tracks to playlist:', await addTracksResponse.json());
            alert('Failed to add tracks to the playlist. Please try again later.');
        }
    } catch (error) {
        console.error('Error creating playlist:', error);
        alert('Failed to create playlist. Please try again later.');
    }
}
