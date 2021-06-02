const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  login();
});
async function login() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const data = {
    email: emailInput.value,
    password: passwordInput.value,
  };
  const apiUrlResponse = await axios.get('/apiUrl');
  if (apiUrlResponse.status === 200) {
    if (apiUrlResponse.data) {
      apiUrl = apiUrlResponse.data.url;

      const loginResponse = await axios.post(`${apiUrl}/auth/login`, data);
      if (loginResponse.status === 200) {
        if (loginResponse.data.access_token) {
          localStorage.setItem('token', loginResponse.data.access_token);
          window.location.href = '/chatList.html';
        }
      }
    }
  }
}
