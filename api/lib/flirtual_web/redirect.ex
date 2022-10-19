defmodule FlirtualWeb.Redirect do
  use Plug.Redirect

  redirect "/discord", "https://discord.gg/flirtual", status: 302
  redirect "/invite", "https://homie.zone/invite", status: 302
  redirect "/speeddate", "https://vrchat.com/home/world/wrld_f5844d7c-dc4d-4ee7-bf3f-63c8e6be5539", status: 302
  redirect "/club", "https://vrchat.com/home/world/wrld_d4f2cc35-83b9-41e9-9b3a-b861691c8df4", status: 302
  redirect "/me", "/", status: 302

end
