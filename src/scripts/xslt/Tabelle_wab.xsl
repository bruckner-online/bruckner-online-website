<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:t="http://www.tei-c.org/ns/1.0"
    xmlns:m="http://www.music-encoding.org/ns/mei"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    exclude-result-prefixes="#all" version="3.0">
    <xsl:output encoding="UTF-8" indent="yes"/>

    <!-- Groups the source tables of all copyists by WAB number. -->

    <xsl:function name="m:sort-by-name">
        <xsl:param name="eingabeliste"/>
        <xsl:perform-sort select="$eingabeliste">
            <xsl:sort select="t:idno[@type='alphabetically_sorted']"/>
        </xsl:perform-sort>
    </xsl:function>

    <!-- Titles differing only in case, spaces or hyphens ("Messe in e-Moll", "Messe in E moll") are one title. -->
    <xsl:function name="m:title-key" as="xs:string">
        <xsl:param name="title"/>
        <xsl:sequence select="replace(lower-case(normalize-space($title)), '[\s\-]', '')"/>
    </xsl:function>

    <xsl:template match="t:TEI">
        <xsl:variable name="Person"
            select="(for $uri in sort(uri-collection('../../data/editions?select=*.xml;recurse=yes')) return doc($uri))/t:TEI/t:text/t:body/t:div"/>
        <TEI xmlns="http://www.tei-c.org/ns/1.0">
            <teiHeader>
                <fileDesc>
                    <titleStmt>
                        <title level="m">Die Wiener Kopisten der Werke Anton Bruckners</title>
                        <title type="sub" level="a">Tabelle 5 – Kopisten nach WAB-Nummer</title>
                        <author>
                            <name>Paul Hawkshaw</name>
                            <name>Clemens Gubsch</name>
                        </author>
                    </titleStmt>
                    <publicationStmt>
                        <publisher>XXX Project Name XXX</publisher>
                        <idno type="BrucknerKopisten"/>
                    </publicationStmt>
                    <sourceDesc>
                        <p>Automatisch erstellt aus den Quellentabellen der Kopisten.</p>
                    </sourceDesc>
                </fileDesc>
                <profileDesc>
                    <textClass>
                        <keywords>
                            <term>Tabelle</term>
                        </keywords>
                    </textClass>
                </profileDesc>
            </teiHeader>
            <text>
                <body>
                    <div>
                        <table>
                            <head xml:lang="de">Tabelle 5 – Kopisten nach WAB-Nummer</head>
                            <head xml:lang="eng">Table 5 – Copyists by WAB Number</head>
                            <row xml:lang="de" role="label">
                                <cell>WAB-Nummer</cell>
                                <cell>Werktitel</cell>
                                <cell>Kopisten</cell>
                            </row>
                            <row xml:lang="eng" role="label">
                                <cell>WAB Number</cell>
                                <cell>Work Title</cell>
                                <cell>Copyist</cell>
                            </row>
                            <xsl:for-each-group
                                select="$Person//t:row[@role='data']/t:cell[@role='WAB-Nummer'][normalize-space()]"
                                group-by="normalize-space()">
                                <xsl:sort select="current-grouping-key()"/>
                                <row role="data">
                                    <cell role="WAB-Nummer">
                                        <xsl:copy-of select="current-group()[1]/node()"/>
                                    </cell>
                                    <!-- Most frequent title first, each in its most frequent spelling. -->
                                    <xsl:variable name="titles" as="xs:string*">
                                        <xsl:for-each-group
                                            select="current-group()/../t:cell[@role='Werktitel'][normalize-space()]"
                                            group-by="m:title-key(.)">
                                            <xsl:sort select="count(current-group())" order="descending"/>
                                            <xsl:variable name="spellings" as="xs:string*">
                                                <xsl:for-each-group select="current-group()" group-by="normalize-space()">
                                                    <xsl:sort select="count(current-group())" order="descending"/>
                                                    <xsl:sequence select="current-grouping-key()"/>
                                                </xsl:for-each-group>
                                            </xsl:variable>
                                            <xsl:sequence select="$spellings[1]"/>
                                        </xsl:for-each-group>
                                    </xsl:variable>
                                    <!-- Titles name the movements copied ("2. Symphonie, 1. Satz"); the work title covers them. -->
                                    <cell role="Werktitel">
                                        <xsl:value-of separator="; " select="
                                            $titles[not(some $title in $titles satisfies starts-with(., concat($title, ',')))]"/>
                                    </cell>
                                    <cell role="Kopisten">
                                        <xsl:for-each select="m:sort-by-name(current-group()/ancestor::t:body/t:div/t:listPerson/t:person)">
                                            <ref corresp="{ancestor::t:div/@xml:id}"
                                                target="{concat('data/editions/', tokenize(document-uri(root(.)), '/')[last()])}">
                                                <xsl:choose>
                                                    <xsl:when test="starts-with(t:persName[@type = 'main'], 'Kopist')">
                                                        <persName type="main">
                                                            <xsl:value-of select="t:idno[@type='alphabetically_sorted']"/>
                                                        </persName>
                                                    </xsl:when>
                                                    <xsl:when test="t:persName[@subtype]">
                                                        <persName type="main">
                                                            <xsl:value-of select="concat(
                                                                t:persName[@type='main']/text(),
                                                                ' (', t:persName/@subtype, ')')"/>
                                                        </persName>
                                                    </xsl:when>
                                                    <xsl:otherwise>
                                                        <xsl:copy-of select="t:persName[@type='main']"/>
                                                    </xsl:otherwise>
                                                </xsl:choose>
                                            </ref>
                                        </xsl:for-each>
                                    </cell>
                                </row>
                            </xsl:for-each-group>
                        </table>
                    </div>
                </body>
            </text>
        </TEI>
    </xsl:template>
</xsl:stylesheet>
