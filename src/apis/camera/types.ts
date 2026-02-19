export interface CameraResponse {
    vms_id: number;
    camera_id: string;
    camera_name: string;
    is_ptz: 0 | 1;
    auth_ptz_control: 0 | 1;
    resolution_width: number;
    resolution_height: number;
    camera_login_id: string;
    camera_login_pw: string;
    camera_ip: string;
    camera_port: number;
}
