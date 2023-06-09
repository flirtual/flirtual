%{
if {logged_in} {
    (onboarded volume konami optout premium supporter logged_email avatar) = \
        `` \n {redis graph read 'MATCH (u:user {username: '''$logged_user'''})
                                 OPTIONAL MATCH (u)-[:AVATAR]->(a:avatar)
                                 RETURN NOT exists(u.onboarding), u.volume, u.konami, u.optout,
                                        exists(u.premium), exists(u.supporter), u.email,
                                        a.url ORDER BY a.order LIMIT 1'}
}
%}

<!DOCTYPE html>
<html lang="en">
    <head>
%{
        if {!isempty $title} {
            title = $title' - Flirtual'
        } {
            title = `{basename $req_path}^' - Flirtual'
        }
%}
        <title>%($title%)</title>
        <meta name="description" content="Meet new people in Virtual Reality! Flirtual helps you go on dates in VR and VRChat. Formerly VRLFP.">

%       if {~ $req_path /onboarding/* || ~ $req_path /nsfw} {
            <link rel="stylesheet" href="/css/tagify.css" media="print" onload="this.media='all'; this.onload=null;">
%       }
        <link rel="stylesheet" href="/css/microtip.css" media="print" onload="this.media='all'; this.onload=null;">
        <link rel="stylesheet" href="/css/swiper.css" media="print" onload="this.media='all'; this.onload=null;">
        <link rel="stylesheet" href="/css/style.css?v=%($dateun%)" onload="this.media='all'; this.onload=null;">
%       if {logged_in} {
            <link rel="stylesheet" href="/converse/converse.min.css?v=3" media="screen" onload="this.media='all'; this.onload=null;">
%       }
%       if {~ $req_path /homies || {~ $req_path /undo && ~ $p_return /homies}} {
            <style>
                :root {
                    --gradient-l: #82bf72;
                    --gradient-r: #4d8888;
                    --bg: #e9f7ef;
                }
            </style>
%       }

        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=0">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=0">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=0">
        <link rel="manifest" href="/site.webmanifest?v=6">
        <link rel="mask-icon" href="/safari-pinned-tab.svg?v=0" color="#e9658b">
        <link rel="shortcut icon" href="/favicon.ico?v=0">

        <meta name="apple-mobile-web-app-title" content="Flirtual">
        <meta name="application-name" content="Flirtual">
        <meta name="msapplication-TileColor" content="#e9658b">
        <meta name="theme-color" content="#e9658b">

        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=600, user-scalable=no" />

%       # Open Graph
%       if {isempty $q_redirect} {
%           og_url = https://$domain$req_path
%       } {
%           og_url = https://$domain$q_redirect
%       }
        <meta property="og:url" content="%($og_url%)" />
        <meta name="twitter:site" content="@getflirtual" />
%       (exists displayname bio id) = \
%           `` \n {redis graph read 'MATCH (u:user {username: '''`{echo $og_url | sed 's/^https:\/\/'$domain'\///'}^'''})
%                                    RETURN (exists(u) AND
%                                            (NOT exists(u.onboarding) OR
%                                             exists(u.vrlfp)) AND
%                                            NOT exists(u.banned)),
%                                           u.displayname, u.bio, u.id'}
%       if {~ $exists true} {
            <meta property="og:type" content="profile" />
            <meta property="og:title" content="%($displayname%)" />
            <meta property="profile:username" content="%($displayname%)" />
            <meta property="og:site_name" content="Flirtual" />
%           bio = `{/bin/echo -en `{echo $bio | sed 's/\\"/"/g'} | sed 's//''/g' |
%                   html2text -utf8 -style pretty | sed 's/"/\&quot;/g'}
%           if {! isempty $bio} {
                <meta property="og:description" content="%($bio%)" />
%           }
            <meta property="og:image" content="https://storage.googleapis.com/flirtual-og/%($id%).png" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta name="twitter:card" content="summary_large_image" />
%       } {
            <meta property="og:type" content="website" />
            <meta property="og:title" content="%($title%)" />
            <meta property="og:description" content="The first and largest VR dating app. Join thousands for dates in VR apps like VRChat." />
            <meta property="og:image" content="https://flirtu.al/android-chrome-512x512.png" />
            <meta property="og:image:width" content="512" />
            <meta property="og:image:width" content="512" />
            <meta name="twitter:card" content="summary" />
%       }

%       if {~ $req_path /onboarding/* || ~ $req_path /nsfw} {
            <script type="text/javascript" src="/js/tagify.js"></script>
%       }
        <script type="text/javascript" src="/js/swiper.js"></script>
        <script>
            (function(src, cb) {
                var s = document.createElement('script');
                s.setAttribute('src', src);
                s.onload = cb;
                (document.head || document.body).appendChild(s);
            })('https://media.flirtu.al/libs/blinkloader/3.x/blinkloader.min.js', function() {
                window.Blinkloader.optimize({
                    "pubkey": "130267e8346d9a7e9bea",
                    "cdnBase": "https://media.flirtu.al",
                    "smartCompression": true,
                    "retina": true,
                    "webp": true,
                    "lazyload": true,
                    "responsive": true,
                    "fadeIn": true,
                    "progressive": true
                });
            })
        </script>

        <script src="/js/main.js?v=%($dateun%)"></script>
    </head>

    <body>
%       if {~ $onboarded true} {
            <svg id="blob" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <linearGradient id="gradient" gradientTransform="rotate(20)">
                    <stop offset="10%" stop-color="var(--gradient-l)" />
                    <stop offset="90%" stop-color="var(--gradient-r)" />
                </linearGradient>
                <path fill="url(#gradient)" d="M43.2,-68.1C51.4,-61.9,50.4,-42.2,51.5,-27.2C52.7,-12.2,55.9,-1.8,57.9,10.7C59.8,23.3,60.4,38.1,54.4,49.6C48.3,61.1,35.5,69.2,23,68.4C10.4,67.6,-1.8,57.8,-13.7,51.9C-25.6,46.1,-37.2,44.1,-45,37.6C-52.7,31.1,-56.7,19.9,-56.6,9.2C-56.5,-1.5,-52.3,-11.8,-49.3,-24.2C-46.2,-36.6,-44.3,-51.3,-36.3,-57.6C-28.3,-63.8,-14.1,-61.7,1.7,-64.3C17.5,-66.9,35,-74.2,43.2,-68.1Z" transform="translate(100 100)" />
            </svg>

            <nav>
                <a onclick="toggle_nav()"></a>
                <span>☰</span>
                <ul>
                    <li><a href="/" aria-label="Find new dates" role="tooltip" data-microtip-position="right">Browse</a></li>
                    <li><a href="/homies" aria-label="Find new homies" role="tooltip" data-microtip-position="right">Homies</a></li>
                    <li><a href="/matches" aria-label="Message your matches" role="tooltip" data-microtip-position="right">Matches</a></li>
                    <li><a href="/premium" aria-label="Get Premium features" role="tooltip" data-microtip-position="right">Premium</a></li>
                    <li>
                        <div>
                            <a href="/me">Profile</a>
                            <a href="/settings">Settings</a>
                            <a href="/logout">Logout</a>
                        </div>
                        <img data-blink-ops="scale-crop: 64x64; scale-crop-position: smart_faces_points"
                             data-blink-uuid="%($avatar%)"
                             onclick="toggle_personal()" />
                    </li>
                </ul>
            </nav>
%       }

        <main>
%           # Display `throw`n errors
%           if {! isempty $notice} {
                <div class="notice">%($notice%) :(</div>
%           }

%           # Do the thing!
%           $handler_body
        </main>

%       # Footer
        <footer>
            <div class="center">
                <div class="appbadges">
                    <a href="https://play.google.com/store/apps/details?id=zone.homie.flirtual.pwa&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1" target="_blank">
                        <img alt="Google Play" src="/img/appbadges/googleplay.png?v=2" />
                    </a>
                </div>

                <div class="socials">
                    <a onclick="FreshworksWidget('open');" aria-label="Contact us" role="tooltip" data-microtip-position="top">
                        <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTUwMi4zIDE5MC44YzMuOS0zLjEgOS43LS4yIDkuNyA0LjdWNDAwYzAgMjYuNS0yMS41IDQ4LTQ4IDQ4SDQ4Yy0yNi41IDAtNDgtMjEuNS00OC00OFYxOTUuNmMwLTUgNS43LTcuOCA5LjctNC43IDIyLjQgMTcuNCA1Mi4xIDM5LjUgMTU0LjEgMTEzLjYgMjEuMSAxNS40IDU2LjcgNDcuOCA5Mi4yIDQ3LjYgMzUuNy4zIDcyLTMyLjggOTIuMy00Ny42IDEwMi03NC4xIDEzMS42LTk2LjMgMTU0LTExMy43ek0yNTYgMzIwYzIzLjIuNCA1Ni42LTI5LjIgNzMuNC00MS40IDEzMi43LTk2LjMgMTQyLjgtMTA0LjcgMTczLjQtMTI4LjcgNS44LTQuNSA5LjItMTEuNSA5LjItMTguOXYtMTljMC0yNi41LTIxLjUtNDgtNDgtNDhINDhDMjEuNSA2NCAwIDg1LjUgMCAxMTJ2MTljMCA3LjQgMy40IDE0LjMgOS4yIDE4LjkgMzAuNiAyMy45IDQwLjcgMzIuNCAxNzMuNCAxMjguNyAxNi44IDEyLjIgNTAuMiA0MS44IDczLjQgNDEuNHoiLz48L3N2Zz4=" alt="Contact" />
                    </a>
                    <a href="/discord" target="_blank" aria-label="Join our Discord" role="tooltip" data-microtip-position="top">
                        <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgdmlld0JveD0iMCAwIDY0MCA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTUyNC41MzEsNjkuODM2YTEuNSwxLjUsMCwwLDAtLjc2NC0uN0E0ODUuMDY1LDQ4NS4wNjUsMCwwLDAsNDA0LjA4MSwzMi4wM2ExLjgxNiwxLjgxNiwwLDAsMC0xLjkyMy45MSwzMzcuNDYxLDMzNy40NjEsMCwwLDAtMTQuOSwzMC42LDQ0Ny44NDgsNDQ3Ljg0OCwwLDAsMC0xMzQuNDI2LDAsMzA5LjU0MSwzMDkuNTQxLDAsMCwwLTE1LjEzNS0zMC42LDEuODksMS44OSwwLDAsMC0xLjkyNC0uOTFBNDgzLjY4OSw0ODMuNjg5LDAsMCwwLDExNi4wODUsNjkuMTM3YTEuNzEyLDEuNzEyLDAsMCwwLS43ODguNjc2QzM5LjA2OCwxODMuNjUxLDE4LjE4NiwyOTQuNjksMjguNDMsNDA0LjM1NGEyLjAxNiwyLjAxNiwwLDAsMCwuNzY1LDEuMzc1QTQ4Ny42NjYsNDg3LjY2NiwwLDAsMCwxNzYuMDIsNDc5LjkxOGExLjksMS45LDAsMCwwLDIuMDYzLS42NzZBMzQ4LjIsMzQ4LjIsMCwwLDAsMjA4LjEyLDQzMC40YTEuODYsMS44NiwwLDAsMC0xLjAxOS0yLjU4OCwzMjEuMTczLDMyMS4xNzMsMCwwLDEtNDUuODY4LTIxLjg1MywxLjg4NSwxLjg4NSwwLDAsMS0uMTg1LTMuMTI2YzMuMDgyLTIuMzA5LDYuMTY2LTQuNzExLDkuMTA5LTcuMTM3YTEuODE5LDEuODE5LDAsMCwxLDEuOS0uMjU2Yzk2LjIyOSw0My45MTcsMjAwLjQxLDQzLjkxNywyOTUuNSwwYTEuODEyLDEuODEyLDAsMCwxLDEuOTI0LjIzM2MyLjk0NCwyLjQyNiw2LjAyNyw0Ljg1MSw5LjEzMiw3LjE2YTEuODg0LDEuODg0LDAsMCwxLS4xNjIsMy4xMjYsMzAxLjQwNywzMDEuNDA3LDAsMCwxLTQ1Ljg5LDIxLjgzLDEuODc1LDEuODc1LDAsMCwwLTEsMi42MTEsMzkxLjA1NSwzOTEuMDU1LDAsMCwwLDMwLjAxNCw0OC44MTUsMS44NjQsMS44NjQsMCwwLDAsMi4wNjMuN0E0ODYuMDQ4LDQ4Ni4wNDgsMCwwLDAsNjEwLjcsNDA1LjcyOWExLjg4MiwxLjg4MiwwLDAsMCwuNzY1LTEuMzUyQzYyMy43MjksMjc3LjU5NCw1OTAuOTMzLDE2Ny40NjUsNTI0LjUzMSw2OS44MzZaTTIyMi40OTEsMzM3LjU4Yy0yOC45NzIsMC01Mi44NDQtMjYuNTg3LTUyLjg0NC01OS4yMzlTMTkzLjA1NiwyMTkuMSwyMjIuNDkxLDIxOS4xYzI5LjY2NSwwLDUzLjMwNiwyNi44Miw1Mi44NDMsNTkuMjM5QzI3NS4zMzQsMzEwLjk5MywyNTEuOTI0LDMzNy41OCwyMjIuNDkxLDMzNy41OFptMTk1LjM4LDBjLTI4Ljk3MSwwLTUyLjg0My0yNi41ODctNTIuODQzLTU5LjIzOVMzODguNDM3LDIxOS4xLDQxNy44NzEsMjE5LjFjMjkuNjY3LDAsNTMuMzA3LDI2LjgyLDUyLjg0NCw1OS4yMzlDNDcwLjcxNSwzMTAuOTkzLDQ0Ny41MzgsMzM3LjU4LDQxNy44NzEsMzM3LjU4WiIvPjwvc3ZnPg==" alt="Discord" />
                    </a>
                    <a href="https://twitter.com/getflirtual" target="_blank" aria-label="Follow us" role="tooltip" data-microtip-position="top">
                        <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQ1OS4zNyAxNTEuNzE2Yy4zMjUgNC41NDguMzI1IDkuMDk3LjMyNSAxMy42NDUgMCAxMzguNzItMTA1LjU4MyAyOTguNTU4LTI5OC41NTggMjk4LjU1OC01OS40NTIgMC0xMTQuNjgtMTcuMjE5LTE2MS4xMzctNDcuMTA2IDguNDQ3Ljk3NCAxNi41NjggMS4yOTkgMjUuMzQgMS4yOTkgNDkuMDU1IDAgOTQuMjEzLTE2LjU2OCAxMzAuMjc0LTQ0LjgzMi00Ni4xMzItLjk3NS04NC43OTItMzEuMTg4LTk4LjExMi03Mi43NzIgNi40OTguOTc0IDEyLjk5NSAxLjYyNCAxOS44MTggMS42MjQgOS40MjEgMCAxOC44NDMtMS4zIDI3LjYxNC0zLjU3My00OC4wODEtOS43NDctODQuMTQzLTUxLjk4LTg0LjE0My0xMDIuOTg1di0xLjI5OWMxMy45NjkgNy43OTcgMzAuMjE0IDEyLjY3IDQ3LjQzMSAxMy4zMTktMjguMjY0LTE4Ljg0My00Ni43ODEtNTEuMDA1LTQ2Ljc4MS04Ny4zOTEgMC0xOS40OTIgNS4xOTctMzcuMzYgMTQuMjk0LTUyLjk1NCA1MS42NTUgNjMuNjc1IDEyOS4zIDEwNS4yNTggMjE2LjM2NSAxMDkuODA3LTEuNjI0LTcuNzk3LTIuNTk5LTE1LjkxOC0yLjU5OS0yNC4wNCAwLTU3LjgyOCA0Ni43ODItMTA0LjkzNCAxMDQuOTM0LTEwNC45MzQgMzAuMjEzIDAgNTcuNTAyIDEyLjY3IDc2LjY3IDMzLjEzNyAyMy43MTUtNC41NDggNDYuNDU2LTEzLjMyIDY2LjU5OS0yNS4zNC03Ljc5OCAyNC4zNjYtMjQuMzY2IDQ0LjgzMy00Ni4xMzIgNTcuODI3IDIxLjExNy0yLjI3MyA0MS41ODQtOC4xMjIgNjAuNDI2LTE2LjI0My0xNC4yOTIgMjAuNzkxLTMyLjE2MSAzOS4zMDgtNTIuNjI4IDU0LjI1M3oiLz48L3N2Zz4=" alt="Twitter" />
                    </a>
                </div>

                <a href="/events">Events</a>
                <a onclick="FreshworksWidget('open');">Support</a>
                <a href="mailto:press@flirtu.al">Press</a>
                <a href="/developers">Developers</a><br />

                <a href="/about">About Us</a>
                <a href="/terms">Terms of Service</a>
                <a href="/privacy">Privacy Policy</a>
            </div>

            <div>
                <div class="desktop">
                    Made with &#9829;&#xFE0E; in VR
                    <span class="right">© 2022 ROVR Labs</span>
                </div>
                <div class="mobile center">
                    <span>© 2022 ROVR Labs</span>
                </div>
            </div>
        </footer>

        <script>
            if ("serviceWorker" in navigator) {
                window.addEventListener("load", function() {
                    navigator.serviceWorker.register("/sw.js").then(function(registration) {
                        console.log("ServiceWorker registration successful with scope: ", registration.scope);
                    }, function(err) {
                        console.log("ServiceWorker registration failed: ", err);
                    });
                });
            }

            if ((window.matchMedia("(display-mode: standalone)").matches) ||
                (window.navigator.standalone) ||
                document.referrer.includes("android-app://")) {
                document.querySelector(".appbadges").style.display = "none";
            }
        </script>

%       if {~ $konami true} {
            <script>
                window.addEventListener("load", function(event) {
                    daynight();
                }, true);
            </script>
%       }

%       # Converse.js Messaging
%       if {logged_in} {
            <audio id="message_audio">
                <source src="/audio/message.mp3" type="audio/mpeg">
                <source src="/audio/message.ogg" type="audio/ogg">
            </audio>
            <script type="text/javascript" src="/converse/converse.min.js?v=8" charset="utf-8" defer></script>
            <script type="text/javascript" src="/js/converseconfig.js?v=8" charset="utf-8" defer></script>
            <script>
                document.getElementById("message_audio").volume = %($volume%);
            </script>

%       }
%       if {!~ $optout true} {
            <script>
                var _paq = window._paq = window._paq || [];
                _paq.push(['trackPageView']);
                _paq.push(['enableLinkTracking']);
                (function() {
                    var u="//analytics.flirtu.al/";
%                   if {~ $handler_body 'template tpl/profile.tpl'} {
                        _paq.push(['setCustomUrl', '/profile']);
%                   }
                    _paq.push(['setTrackerUrl', u+'matomo.php']);
                    _paq.push(['setSiteId', '1']);
                    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                    g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
                })();
            </script>
            <noscript><p><img src="//analytics.flirtu.al/matomo.php?idsite=1&amp;rec=1" style="border:0;" alt="" /></p></noscript>
%       }
        <script>
            window.fwSettings={
                'widget_id':73000002566
            };
            !function(){if("function"!=typeof window.FreshworksWidget){var n=function(){n.q.push(arguments)};n.q=[],window.FreshworksWidget=n}}() 
            FreshworksWidget('hide', 'launcher');
%           if {logged_in} {
                FreshworksWidget('identify', 'ticketForm', {
                    name: '%($logged_user%)',
                    email: '%($logged_email%)',
                });
                FreshworksWidget('hide', 'ticketForm', ['name', 'email']);
%           }
        </script>
        <script type='text/javascript' src='https://widget.freshworks.com/widgets/73000002566.js' async defer></script>
    </body>
</html>
