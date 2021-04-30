
function login() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const data = {
        email: emailInput.value,
        password: passwordInput.value,
    };
    axios.get('/apiUrl').then((apiUrlResponse) => {
        if(apiUrlResponse.status === 200) {
            if(apiUrlResponse.data) {
                const apiUrl = apiUrlResponse.data.url;
                
                axios.post(`${apiUrl}/auth/login`, data).then((response) => {
                    if(response.status === 200) {
                        if(response.data.access_token) {
                            localStorage.setItem('token', response.data.access_token);
                            window.location.href='/chatList.html';
                        }
                        
                    }
                    
                });
            }
        }
    }).catch(error => console.log(error));
    

}