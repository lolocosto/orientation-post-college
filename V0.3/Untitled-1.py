// Remplacez par vos vraies valeurs
const testAppId = "69711beb357466e3a88b4572";

fetch('https://api.opendata.onisep.fr/api/1.0/dataset/5fa5816ac6a6e/search?size=3', {
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token,  // token obtenu du Test 2
        'Application-ID': testAppId
    }
})
.then(r => r.json())
.then(data => console.log('Résultats:', data));