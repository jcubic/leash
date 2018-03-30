#!/usr/bin/perl -w
#  This file is part of Leash (Browser Shell)
#  Copyright (C) 2013-2018  Jakub Jankiewicz <http://jcubic.pl/me>
#
#  Released under the MIT license
#

use warnings;
use lib qw(.);
use JSON qw( );
use POSIX qw(locale_h);
use locale;

setlocale(LC_ALL, 'en_US.UTF-8');
$ENV{'LC_ALL'} = 'en_US.UTF-8';

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

print "Content-Type: text/plain\r\n\r\n";

if ($ENV{'REMOTE_ADDR'} eq $ENV{'SERVER_ADDR'}) {
    if (valid_token($ENV{'QUERY_STRING'})) {
        system(join("", <STDIN>));
    } else {
        print "wrong token";
    }
} else {
    print "invalid host";
}
