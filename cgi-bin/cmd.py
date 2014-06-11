#!/usr/bin/python
#  This file is part of Leash (Browser Shell)
#  Copyright (C) 2013-2014  Jakub Jankiewicz <http://jcubic.pl>
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.

import cgitb; cgitb.enable()
import subprocess, os
from sys import stdout, stdin
import json

def shell_exec(code):
    os.chdir('..') # where are in cgi-bin
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
    stdout.write(json.serialize(response))
