/*
 *  JSON-RPC Client implementaion in Javascript
 *  Copyright (C) 2009 Jakub Jankiewicz <http://jcubic.pl> 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

var rpc = (function() {
    function rpc(url, id, method, params, success, error, debug) {
        var request  = {
            'version': '1.1', 'method': method,
            'params': params, 'id': id
        };
        if (debug && debug.constructor === Function) {
            debug(request, 'request');
        }
        return $.ajax({
            url: url,
            data: JSON.stringify(request),
            success: debug && debug.constructor === Function ? function(response) {
                debug(response, 'response');
                success(response);
            } : success,
            error: error,
            accepts: 'application/json',
            contentType: 'application/json',
            dataType: 'json',
            async: true,
            cache: false,
            //timeout: 1,
            type: 'POST'});
    }
    return function(options) {
        var id = 1;
        function ajax_error(jxhr, status, thrown) {
            if (jxhr.readyState !== 0 || options.errorOnAbort) {
                var message;
                if (!thrown) {
                    message = jxhr.status + ' ' + jxhr.statusText;
                } else {
                    message = thrown;
                }
                message = 'AJAX Error: "' + message + '"';
                if (options.error) {
                    options.error({
                        message: message,
                        code: 300
                    });
                } else {
                    throw message;
                }
            }
        }
        function rpc_wrapper(method) {
            return function(/* args */) {
                var args = Array.prototype.slice.call(arguments);
                return function(continuation) {
                    rpc(options.url, id++, method, args, function(resp) {
                        if (!resp) {
                            var message = "No response from method `" +
                                method + "'";
                            if (options.error) {
                                options.error({
                                    code: 301,
                                    message: message
                                });
                            } else {
                                throw message;
                            }
                        } else if (resp.error) {
                            if (options.error) {
                                options.error(resp.error);
                            } else {
                                throw resp.error.message;
                            }
                        } else {
                            continuation(resp.result);
                        }
                    }, ajax_error, options.debug);
                };
            };
        }
        return function(continuation) {
            rpc(options.url, id++, 'system.describe', null, function(response) {
                var message;
                if (!response) {
                    if (options.error) {
                        message = "No response from `system.describe' method";
                        options.error({
                            code: 301,
                            message: message
                        });
                    } else {
                        throw message;
                    }
                } else if (response.error) {
                    if (options.error) {
                        options.error(response.error);
                    } else {
                        throw response.error.message;
                    }
                } else {
                    var service = {};
                    $.each(response.procs, function(i, proc) {
                        service[proc.name] = rpc_wrapper(proc.name);
                        service[proc.name].toString = function() {
                            return "#<rpc-method: `" + proc.name + "'>";
                        };
                    });
                    continuation(service, response);
                }
            }, ajax_error, options.debug);
        };
    };
})();
