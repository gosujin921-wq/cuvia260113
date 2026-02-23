export interface CameraVmsInfo {
    vms_id: number;
    vms_mfr: string;
    vms_product: string;
    vms_ip: string;
    vms_port: number;
    vms_login_id: string;
    vms_login_pw: string;
}

export interface CameraListPageData {
    rtsp_url: string;
    camera_id: string;
    camera_name: string;
    is_ptz: 0 | 1; // 0: no, 1: yes
    auth_ptz_control: 0 | 1; // 0: no, 1: yes
    resolution_width: number;
    resolution_height: number;
    rtsp_ip: string;
    rtsp_port: number;
    stream_no: number;
    vms_info: CameraVmsInfo;
}

export interface CameraResponse {
    page: number;
    page_size: number;
    total: number;
    page_data: CameraListPageData[];
}

export interface IceServerInfo {
    urls: string;
    username?: string;
    credential?: string;
}

export interface IceServerResponse {
    ice_servers: IceServerInfo[];
}

export interface CameraAssignInfo {
    bridge_id: string;
    camera_id: string;
    camera_name: string;
    rtsp_url: string;
    is_grouped: string;
    is_main: string;
    is_robot: string;
}

export interface CameraAssignCameraInfo {
    camera_info: CameraAssignInfo[];
}

export interface CameraAssignRequest {
    camera_id?: string;
    camera_name?: string;
    is_grouped?: string;
    is_main?: string;
    is_robot?: string;
}
