<?php
/**
 * Plugin Name: RVKH Telegram Bot API
 * Description: API endpoints to serve as backend for Telegram Bot webhook.
 * Version: 1.0.0
 * Author: Antigravity
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    $namespace = 'rvkh/v1';

    // GET /wp-json/rvkh/v1/user/{id_or_email}
    register_rest_route($namespace, '/user/(?P<id_or_email>[a-zA-Z0-9.@_-]+)', array(
        'methods' => 'GET',
        'callback' => 'rvkh_get_user_info',
        'permission_callback' => '__return_true',
    ));

    // POST /wp-json/rvkh/v1/lock/{id_or_email}
    register_rest_route($namespace, '/lock/(?P<id_or_email>[a-zA-Z0-9.@_-]+)', array(
        'methods' => 'POST',
        'callback' => 'rvkh_lock_user',
        'permission_callback' => '__return_true',
    ));

    // POST /wp-json/rvkh/v1/unlock/{id_or_email}
    register_rest_route($namespace, '/unlock/(?P<id_or_email>[a-zA-Z0-9.@_-]+)', array(
        'methods' => 'POST',
        'callback' => 'rvkh_unlock_user',
        'permission_callback' => '__return_true',
    ));
});



/**
 * Helper to find user by ID or Email
 */
function rvkh_get_user_by_id_or_email($id_or_email)
{
    if (is_email($id_or_email)) {
        return get_user_by('email', $id_or_email);
    }
    elseif (is_numeric($id_or_email)) {
        return get_user_by('id', $id_or_email);
    }
    return get_user_by('login', $id_or_email);
}

/**
 * Basic user info callback
 */
function rvkh_get_user_info($data)
{
    $user = rvkh_get_user_by_id_or_email($data['id_or_email']);

    if (!$user) {
        return new WP_Error('no_user', 'User not found', array('status' => 404));
    }

    $is_locked = get_user_meta($user->ID, 'rvkh_user_locked', true);

    return array(
        'id' => $user->ID,
        'username' => $user->user_login,
        'email' => $user->user_email,
        'display_name' => $user->display_name,
        'status' => $is_locked ? 'locked' : 'active',
        'roles' => $user->roles,
    );
}

/**
 * Lock user callback
 */
function rvkh_lock_user($data)
{
    $user = rvkh_get_user_by_id_or_email($data['id_or_email']);

    if (!$user) {
        return new WP_Error('no_user', 'User not found', array('status' => 404));
    }

    update_user_meta($user->ID, 'rvkh_user_locked', '1');

    return array('success' => true, 'message' => 'User locked');
}

/**
 * Unlock user callback
 */
function rvkh_unlock_user($data)
{
    $user = rvkh_get_user_by_id_or_email($data['id_or_email']);

    if (!$user) {
        return new WP_Error('no_user', 'User not found', array('status' => 404));
    }

    delete_user_meta($user->ID, 'rvkh_user_locked');

    return array('success' => true, 'message' => 'User unlocked');
}
