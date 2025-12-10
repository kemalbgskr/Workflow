fetch('http://localhost:5000/api/clear-all', {
  method: 'POST'
})
.then(res => res.json())
.then(data => console.log('Cleared:', data))
.catch(err => console.error('Error:', err));