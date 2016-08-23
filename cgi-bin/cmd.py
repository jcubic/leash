#!/usr/bin/python
#  This file is part of Leash (Browser Shell)
#  Copyright (C) 2013-2014  Jakub Jankiewicz <http://jcubic.pl>
#
#  Released under the MIT license

import cgitb; cgitb.enable()
import subprocess, os
from sys import stdout, stdin
import json

def shell_exec(code):
    try:
        return subprocess.check_output(code, shell=True)
    except subprocess.CalledProcessError as e:
        return e.output

def trace():
    import traceback, StringIO
    buff = StringIO.StringIO()
    traceback.print_exc(file=buff)
    return buff.getvalue()

if __name__ == '__main__':
    print "Content-Type: application/json"
    print
    import os
    from utils import valid_token
    response = {}
    if not os.environ['REMOTE_ADDR'] == os.environ['SERVER_ADDR']:
        response['error'] = 'You can access this script only from same server ' + \
                            '(Service.php script)'
    elif valid_token():
        try:
            response['result'] = shell_exec(stdin.read())
        except Exception, e:
            response['error'] = e.args[0]
            response['trace'] = trace()
    else:
        response['error'] = "The token is invalid"
    stdout.write(json.dumps(response))
