#!/usr/bin/perl
#  This file is part of Leash (Browser Shell)
#  Copyright (C) 2013-2014  Jakub Jankiewicz <http://jcubic.pl>
#
#  Released under the MIT license
#

use strict;
use warnings;
use lib qw(..);
use JSON qw( );

sub valid_token {
    my $filename = '../config.json';

    my $json_text = do {
        open(my $json_fh, "<:encoding(UTF-8)", $filename)
            or die("Can't open \$filename\": $!\n");
        local $/;
        <$json_fh>
    };

    my $json = JSON->new;
    my $config = $json->decode($json_text);

    for ( @{$config->{sessions}} ) {
        if ($ENV{'QUERY_STRING'} eq $_->{token}) {
            return 1;
        }
    }
    return 0;
}

if ($ENV{'REMOTE_ADDR'} eq $ENV{'SERVER_ADDR'}) {
    if (valid_token()) {
        print "Content-Type: text/plain\n\n";
        system(join("", <STDIN>));
    }
}
