/**
 * 数据包长度4   数据包头部长度2   协议版本2  操作类型4   数据包头部信息4   数据包内容
 */
export const WS_OP_HEARTBEAT = 2 // 心跳
export const WS_OP_HEARTBEAT_REPLY = 3 // 心跳回应
export const WS_OP_MESSAGE = 5 // 弹幕消息等
export const WS_OP_USER_AUTHENTICATION = 7// 用户进入房间
export const WS_OP_CONNECT_SUCCESS = 8 // 进房回应

export const WS_PACKAGE_HEADER_TOTAL_LENGTH = 16// 头部字节大小
export const WS_PACKAGE_OFFSET = 0
export const WS_HEADER_OFFSET = 4
export const WS_VERSION_OFFSET = 6
export const WS_OPERATION_OFFSET = 8
export const WS_SEQUENCE_OFFSET = 12
export const WS_BODY_PROTOCOL_VERSION_NORMAL = 0// 普通消息
export const WS_BODY_PROTOCOL_VERSION_BROTLI = 3// brotli压缩信息
export const WS_HEADER_DEFAULT_VERSION = 1
export const WS_HEADER_DEFAULT_OPERATION = 1
export const WS_HEADER_DEFAULT_SEQUENCE = 1
export const WS_AUTH_OK = 0
export const WS_AUTH_TOKEN_ERROR = -101
export const LIVE_URL = 'ws://broadcastlv.chat.bilibili.com/sub'
export const LIVE_SSL_URL = 'wss://broadcastlv.chat.bilibili.com/sub'
