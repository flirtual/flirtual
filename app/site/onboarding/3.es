title = 'Bio & Pics'

require_login
if {! isempty $onboarding && !~ $onboarding 3} {
    post_redirect /
}

if {!~ $REQUEST_METHOD POST} { return 0 }

# Back button -> return to previous onboarding page
if {~ $p_back true} {
    redis graph write 'MATCH (u:user {username: '''$logged_user'''}) SET u.onboarding = 2'
    post_redirect /onboarding/2
}

# Set display name, or if none is chosen, copy username
if {!isempty $p_displayname} {
    redis graph write 'MATCH (u:user {username: '''$logged_user'''})
                       SET u.displayname = '''$^p_displayname''''
    #xmpp set_vcard '{"user": "'$logged_user'", "host": "'$XMPP_HOST'", "name": "FN", "content": "'$^p_displayname'"}'
} {
    redis graph write 'MATCH (u:user {username: '''$logged_user'''})
                       SET u.displayname = '''$logged_user''''
    #xmpp set_vcard '{"user": "'$logged_user'", "host": "'$XMPP_HOST'", "name": "FN", "content": "'$logged_user'"}'
}

# Add profile pics
redis graph write 'MATCH (u:user {username: '''$logged_user'''})-[a:AVATAR]->(:avatar)
                   DELETE a'
pfpset = false
for (avatar = `{echo $post_args | tr ' ' $NEWLINE | grep '^p_pfp_[0-9]*$'}) {
    if {echo $$avatar | grep '^[a-z0-9/\-,]*$'} {
        pfpset = true
        order = `{echo $avatar | sed 's/^p_pfp_//'}
        redis graph write 'MATCH (u:user {username: '''$logged_user'''})
                           MERGE (a:avatar {url: '''$$avatar'''})
                           ON CREATE SET a.scanned = false
                           CREATE (u)-[:AVATAR]->(a)
                           SET a.order = '$order
    }
}
if {~ $pfpset false} {
    redis graph write 'MATCH (u:user {username: '''$logged_user'''})
                       MERGE (u)-[:AVATAR]->(a:avatar {url: ''e8212f93-af6f-4a2c-ac11-cb328bbc4aa4'', order: 0})'
}

# Fix URLs
if {! isempty $p_vrchat} {
    p_vrchat = `{echo $p_vrchat | urlencode | sed 's/\/$//; s/.*\///; s/^/https:\/\/vrchat.com\/home\/search\//' | sanitize_url}
}

# Validate privacy setting
if {!~ $p_privacy everyone && !~ $p_privacy matches && !~ $p_privacy me} {
    throw error 'Invalid privacy setting'
}

# Write
redis graph write 'MATCH (u:user {username: '''$logged_user'''})
                   SET u.bio = '''`^{echo $^p_bio | sed 's/\\//g' | bluemonday | 
                                     sed 's/<a /<a onclick="external_link(event, this)" /g' |
                                     escape_redis}^''',
                       u.vrchat = '''`^{echo $^p_vrchat | escape_redis}^''',
                       u.discord = '''`^{echo $^p_discord | escape_redis}^''',
                       u.privacy_socials = '''$p_privacy''''

profanity $p_displayname
profanity $p_bio

# Proceed
if {! isempty $onboarding} {
    redis graph write 'MATCH (u:user {username: '''$logged_user'''})
                       SET u.onboarding = 4'
    post_redirect /onboarding/4
} {
    redis graph write 'MATCH (u:user {username: '''$logged_user'''})
                       SET u.update_embed = true'
    post_redirect '/settings#edit'
}
