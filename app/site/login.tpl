% if {!logged_in} {
      <a href="/" class="btn btn-gradient" style="transform: translateY(-3.5em)">Home</a>
      <div class="box" style="margin-top: 2em">
          <h1>Login</h1>
          <form action="" method="POST" accept-charset="utf-8">
              <label for="username">Username<small>(or email)</small></label>
              <input type="text" name="username" id="username" required autocomplete="username" value="%(`{echo $^p_username | escape_html}%)">

              <label for="password">Password</label>
              <input type="password" name="password" id="password" required autocomplete="current-password">

              <input type="checkbox" name="staylogged" id="staylogged" value="true" %(`{if {~ $p_staylogged true} { echo checked }}%) style="margin-top: 17px; margin-bottom: 42px">
              <label for="staylogged" style="position: absolute; width: 100%; transform: translate(5px, 15px)">
                  <span class="desktop">
                      Stay logged in
                  </span>
                  <span class="mobile">
                      Remember
                  </span>
              </label>

              <button type="submit" class="btn btn-gradient" style="position: absolute; top: calc(100% - 158px); left: calc(100% - 218px)">Login</button>
          </form>
      </div>

      <div>
          <div class="box-half">
              <p style="margin: 37px 0 50px 0">Forgot your password?</p>
              <a href="/forgot" class="btn">Reset</a>
          </div>
          <div class="box-half">
              <p style="margin: 37px 0 50px 0">Don't have an account yet?</p>
              <a href="/register" class="btn">Sign up</a>
          </div>
      </div>
% } {
      <div class="box">
          <h1>Login</h1>
          <p>You're already logged in!</p>
          <a href="/logout" class="btn">Logout</a>
      </div>
% }
