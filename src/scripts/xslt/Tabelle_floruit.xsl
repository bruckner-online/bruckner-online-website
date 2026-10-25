<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:a="http://relaxng.org/ns/compatibility/annotations/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:teidocx="http://www.tei-c.org/ns/teidocx/1.0"
    xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:rng="http://relaxng.org/ns/structure/1.0"
    xmlns:t="http://www.tei-c.org/ns/1.0" xmlns:teix="http://www.tei-c.org/ns/Examples"
    xmlns:m="http://www.music-encoding.org/ns/mei"
    xmlns:html="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude"
    exclude-result-prefixes="#all" version="3.0">
    <xsl:output encoding="UTF-8" indent="yes"/>

    <xsl:function name="m:sort-by-time">
        <xsl:param name="eingabeliste"/>
        <xsl:perform-sort select="$eingabeliste">
            <xsl:sort select="//t:floruit[1]/@from"/>
            <xsl:sort select="//t:floruit[1]/@to"/>
        </xsl:perform-sort>
    </xsl:function>

    <xsl:template match="t:TEI">
        <TEI xmlns="http://www.tei-c.org/ns/1.0">
            <teiHeader>
                <fileDesc>
                    <titleStmt>
                        <title level="m">Die Wiener Kopisten der Werke Anton Bruckners</title>
                        <title type="sub" level="a">Tabelle 4 – Zeitraum der Kopiertätigkeit der Kopisten zu Bruckners Lebzeiten.</title>
                        <author>
                            <name>Paul Hawkshaw</name>
                            <name>Clemens Gubsch</name>
                        </author>
                        <respStmt>
                            <resp>Automatische Konvertierung nach TEI P5</resp>
                            <name xml:id="cg">Clemens Gubsch</name>
                        </respStmt>
                        <respStmt>
                            <resp>Dokumentvorbereitung, Korrektur und weiterführendes Markup</resp>
                            <name corresp="#cg">Clemens Gubsch</name>
                        </respStmt>
                    </titleStmt>
                    <editionStmt>
                        <edition>
                            <date>2020-11-01</date>
                        </edition>
                    </editionStmt>
                    <publicationStmt>
                        <publisher>XXX Project Name XXX</publisher>
                        <idno type="BrucknerKopisten"/>
                    </publicationStmt>
                    <sourceDesc>
                        <p>Erstellt unter Berücksichtigung des bisherigen Forschungsstandes.</p>
                    </sourceDesc>
                </fileDesc>
                <profileDesc>
                    <textClass>
                        <keywords>
                            <term>Tabelle</term>
                        </keywords>
                    </textClass>
                </profileDesc>
                <revisionDesc>
                    <listChange>
                        <change who="#cg" status="created">Erstellt und geprüft</change>
                    </listChange>
                </revisionDesc>
            </teiHeader>
            <text>
                <body>
                    <div>
                        <table>
                            <head xml:lang="de">Tabelle 4 – Zeitraum der Kopiertätigkeit der Kopisten zu Bruckners Lebzeiten</head>
                            <head xml:lang="eng">Table 4 – Copyists Who Prepared Manuscripts of Bruckner’s Music during his Lifetime and the Approximate Dates of their Copies</head>
                            <row xml:lang="de" role="label">
                                <cell>Zeitraum</cell>
                                <cell>Kopisten</cell>
                            </row>
                            <row xml:lang="eng" role="label">
                                <cell>Period</cell>
                                <cell>Copyist</cell>
                            </row>
                            <xsl:variable name="Person" select="(for $uri in sort(uri-collection('../../data/editions?select=*.xml;recurse=yes')) return doc($uri))/t:TEI/t:text/t:body/t:div"/>
                            <xsl:for-each-group select="m:sort-by-time($Person)" group-by="t:listPerson/t:person/t:floruit[1]">
                               <xsl:choose>
                                    <xsl:when test="not(current()/t:listPerson/t:person/t:floruit = '')">
                                        <row role="data">
                                            <xsl:choose>
                                                <xsl:when test="current()/t:listPerson/t:person/t:floruit/@xml:lang">
                                                    <xsl:if test="current()/t:listPerson/t:person/t:floruit/@xml:lang='de'">
                                                    <xsl:element name="cell">
                                                        <xsl:attribute name="xml:lang">
                                                            <xsl:text>de</xsl:text>
                                                        </xsl:attribute>
                                                        <xsl:element name="date">
                                                            <xsl:attribute name="from">
                                                                <xsl:value-of select="current()/t:listPerson/t:person/t:floruit[@xml:lang='de']/@from"/>
                                                            </xsl:attribute>
                                                            <xsl:attribute name="to">
                                                                <xsl:value-of select="current()/t:listPerson/t:person/t:floruit[@xml:lang='de']/@to"/>
                                                            </xsl:attribute>
                                                            <xsl:attribute name="xml:lang">
                                                                <xsl:text>de</xsl:text>
                                                            </xsl:attribute>
                                                            <xsl:value-of select="current()/t:listPerson/t:person/t:floruit[@xml:lang='de']"/>
                                                            </xsl:element>
                                                        </xsl:element>
                                                    </xsl:if>
                                                    <xsl:if test="current()/t:listPerson/t:person/t:floruit/@xml:lang='eng'">
                                                        <xsl:element name="cell">
                                                            <xsl:attribute name="xml:lang">
                                                                <xsl:text>eng</xsl:text>
                                                            </xsl:attribute>
                                                            <xsl:element name="date">
                                                                 <xsl:attribute name="from">
                                                                     <xsl:value-of select="current()/t:listPerson/t:person/t:floruit[@xml:lang='eng']/@from"/>
                                                                 </xsl:attribute>
                                                                 <xsl:attribute name="to">
                                                                     <xsl:value-of select="current()/t:listPerson/t:person/t:floruit[@xml:lang='eng']/@to"/>
                                                                 </xsl:attribute>
                                                                 <xsl:attribute name="xml:lang">
                                                                     <xsl:text>eng</xsl:text>
                                                                 </xsl:attribute>
                                                                 <xsl:value-of select="current()/t:listPerson/t:person/t:floruit[@xml:lang='eng']"/>
                                                             </xsl:element>
                                                        </xsl:element>
                                                    </xsl:if>
                                                </xsl:when>
                                                <xsl:otherwise>
                                                    <xsl:element name="cell">
                                                        <xsl:element name="date">
                                                            <xsl:attribute name="from">
                                                                <xsl:value-of select="current()/t:listPerson/t:person/t:floruit/@from"/>
                                                            </xsl:attribute>
                                                            <xsl:attribute name="to">
                                                                <xsl:value-of select="current()/t:listPerson/t:person/t:floruit/@to"/>
                                                            </xsl:attribute>
                                                            <xsl:value-of select="current()/t:listPerson/t:person/t:floruit"/>
                                                        </xsl:element>
                                                    </xsl:element>
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        <cell role="Kopisten">
                                            <xsl:for-each select="current-group()/t:listPerson/t:person">
                                                <xsl:variable name="cp-cleaning1" select="
                                                    replace(
                                                    replace(
                                                    replace(
                                                    replace(
                                                    replace(
                                                    replace(
                                                    translate(./t:persName[@type='main'] ,' ', '-')
                                                    , ',', '')
                                                    ,'ß', 'ss')
                                                    , '[éè]', 'e')
                                                    , 'ä', 'a')
                                                    , 'ö', 'o')
                                                    , 'ü', 'u')
                                                    "/>
                                                <xsl:variable name="cp-cleaning2" select="data(translate($cp-cleaning1,'.', ''))"/>
                                                <xsl:variable name="cp-clean" select="translate($cp-cleaning2, '&#xA0;', '-') => lower-case()"/>
                                                <xsl:element name="ref">
                                                    <xsl:attribute name="corresp">
                                                        <xsl:value-of select="//t:div/@xml:id"/>
                                                    </xsl:attribute>
                                                    <xsl:attribute name="target">
                                                        <xsl:value-of
                                                            select="concat('data/editions/', $cp-clean, '.xml')"/>
                                                    </xsl:attribute>
                                                    <xsl:choose>
                                                        <xsl:when test="starts-with(./t:persName[@type = 'main'], 'Kopist')">
                                                            <persName type="main">
                                                                <xsl:value-of select="./t:idno[@type='alphabetically_sorted']"/>
                                                            </persName>
                                                        </xsl:when>
                                                        <xsl:when test=".//t:persName[@subtype]">
                                                            <persName type="main">
                                                                <xsl:value-of select="concat(
                                                                    .//t:persName[@type='main']/text(),
                                                                    ' (',.//t:persName/@subtype, ')')"/>
                                                            </persName>
                                                        </xsl:when>
                                                        <xsl:otherwise>
                                                            <xsl:copy-of select="./t:persName[@type='main']"/>
                                                        </xsl:otherwise>
                                                    </xsl:choose>
                                                </xsl:element>
                                            </xsl:for-each>
                                        </cell>
                                        </row>
                                    </xsl:when>
                                </xsl:choose>
                            </xsl:for-each-group>
                        </table>
                    </div>
                </body>
            </text>
        </TEI>
    </xsl:template>
</xsl:stylesheet>
