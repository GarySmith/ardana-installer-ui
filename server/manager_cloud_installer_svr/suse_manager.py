import config.config as config
from flask import abort
from flask import Blueprint
from flask import jsonify
from flask import request
from . import util
import ssl
import xmlrpclib
import socket

bp = Blueprint('suse-manager', __name__)

SUSE_MANAGER_URL = config.get("suse-manager", "url")
SUSE_MANAGER_USERNAME = config.get("suse-manager", "username")
SUSE_MANAGER_PASSWORD = config.get("suse-manager", "password")
INSECURE = config.get("suse-manager", "insecure", False)
TIMEOUT = 2

"""
Calls to SUSE Manager
"""


def connect():
    context = None
    if INSECURE:
        context = ssl._create_unverified_context()

    client = xmlrpclib.Server(SUSE_MANAGER_URL, verbose=0, context=context)
    key = client.auth.login(SUSE_MANAGER_USERNAME, SUSE_MANAGER_PASSWORD)
    return (client, key)


@bp.route("/api/v1/sm/connection_test", methods=['POST'])
def connection_test():
    context = None
    if INSECURE:
        context = ssl._create_unverified_context()
    creds = request.get_json() or {}
    port = "8443"
    if creds['port'] != 0:
        port = creds['port']
    # check the host and port first before loging
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(TIMEOUT)
        s.connect((creds['host'], int(port)))
    except Exception as e:
        abort(400)
    # login
    try:
        suma_url = "https://" + creds['host'] + ":" + port + "/rpc/api"
        suma_username = creds['username']
        suma_password = creds['password']
        client = xmlrpclib.Server(suma_url, verbose=0, context=context)
        key = client.auth.login(suma_username, suma_password)
        return jsonify(key)
    except Exception as e:
        abort(403)


@bp.route("/api/v1/sm/servers")
def sm_server_list():
    # TODO will fix to use tokenkey passed in
    if util.USE_JSON_SERVER_ONLY:
        return util.forward(util.build_url(None, '/servers'), request)

    client, key = connect()
    server_list = client.system.listActiveSystems(key)
    for server in server_list:
        # last_checkin is an object, which is not json-serializable
        server['last_checkin'] = str(server['last_checkin'])

    return jsonify(server_list)


@bp.route("/api/v1/sm/servers/<id>")
def sm_server_details(id):

    # TODO will fix to use tokenkey passed in
    if util.USE_JSON_SERVER_ONLY:
        return util.forward(util.build_url(None, '/servers' + id), request)

    client, key = connect()
    detail_list = client.system.listActiveSystemsDetails(key, int(id))

    detail = detail_list[0]
    # last_checkin is an object, which is not json-serializable
    detail['last_checkin'] = str(detail['last_checkin'])

    return jsonify(detail)
