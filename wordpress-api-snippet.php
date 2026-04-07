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


/**
 * Plugin Name: RVKH Telegram Bot API
 * Description: API endpoints to serve as backend for Telegram Bot webhook.
 * Version: 1.0.0
 * Author: Antigravity
 */

add_action('rest_api_init', function () {
    $namespace = 'rvkh/v1';
    // Route dùng chung: /wp-json/rvkh/v1/user
    register_rest_route($namespace, '/user', array(
            array(
            'methods' => 'GET',
            'callback' => 'rvkh_handle_user_request',
            'permission_callback' => '__return_true',
        ),
            array(
            'methods' => 'POST',
            'callback' => 'rvkh_handle_user_request',
            'permission_callback' => '__return_true',
        ),
    ));
});

function rvkh_handle_user_request($request)
{
    // Lấy tham số từ Query String (?target=...) hoặc Body
    $target = $request->get_param('target');
    $action = $request->get_param('action'); // info, lock, unlock
    if (empty($target)) {
        return new WP_Error('missing_param', 'Thiếu tham số target (ID hoặc Email)', array('status' => 400));
    }

    $user = rvkh_get_user_by_id_or_email($target);
    if (!$user) {
        return new WP_Error('no_user', 'Không tìm thấy người dùng', array('status' => 404));
    }

    // Xử lý theo từng action (Nếu là GET thì mặc định là lấy info)
    $method = $request->get_method();

    if ($method === 'GET' || $action === 'info') {
        $is_locked = get_user_meta($user->ID, 'uv_locked', true);
        return array(
            'id' => $user->ID,
            'email' => $user->user_email,
            'status' => $is_locked ? 'locked' : 'active'
        );
    }

    $user_id = $user->ID;
    if ($action === 'lock') {
        update_user_meta($user_id, 'uv_locked', 1);
        return array('success' => true, 'message' => 'Đã khóa ' . $target);
    }

    if ($action === 'unlock') {
        delete_user_meta($user_id, 'uv_locked');
        return array('success' => true, 'message' => 'Đã mở khóa ' . $target);
    }

    return new WP_Error('invalid_action', 'Hành động không hợp lệ', array('status' => 400));
}

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