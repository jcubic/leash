#!/usr/bin/python
#  This file is part of Leash (Browser Shell)
#  Copyright (C) 2013-2014  Jakub Jankiewicz <http://jcubic.pl/me>
#
#  Released under the MIT license

import os, re, sys, types
import json_rpc
from StringIO import StringIO

from utils import uniq_id, valid_token

class Interpreter(object):
    def start(self):
        session_id = uniq_id()
        open('../tmp/session_%s.py' % session_id, 'w')
        return session_id

    def info(self):
        import sys
        msg = 'Type "help", "copyright", "credits" or "license" for more information.'
        return "Python %s on %s\n%s" % (sys.version, sys.platform, msg)

    def evaluate(self, session_id, code):
        global modules
        try:
            session_file = '../tmp/session_%s.py' % session_id
            if code.strip() == "license":
                return "Type license() to see the full license text"
            # these in python do the same as a function but they are not show up
            # in scripts
            if re.match("^(copyright|credits)$", code.strip()):
                code = code + "()"
            __stdout = sys.stdout
            sys.stdout = StringIO() # fake stdout
            env = {}
            exec(open(session_file), env)
            #don's show output from privous session
            sys.stdout.seek(0)
            sys.stdout.truncate()
            print eval(code, env)
            result = sys.stdout.getvalue()
            sys.stdout = __stdout
            return result
        except:
            try:
                exec(code, env)
            except:
                sys.stdout = __stdout
                import traceback
                buff = StringIO()
                traceback.print_exc(file=buff)
                #don't show rpc stack
                stack = buff.getvalue().replace('"<string>"', '"<JSON-RPC>"').split('\n')
                return '\n'.join([stack[0]] + stack[3:])
            else:
                result = sys.stdout.getvalue()
                sys.stdout = __stdout
                open(session_file, 'a+').write('\n%s' % code)
                return result

    def destroy(self, session_id):
        os.remove('../tmp/session_%s.py' % session_id)


if __name__ == '__main__':
    if valid_token():
        json_rpc.handle_cgi(Interpreter())
    else:
        print "Content-Type: application/json"
        print
        print json_rpc.serialize({"error": "Invalid token"})


