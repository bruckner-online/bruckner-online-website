<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.tei-c.org/ns/1.0"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:array="http://www.w3.org/2005/xpath-functions/array" xmlns:map="http://www.w3.org/2005/xpath-functions/map" exclude-result-prefixes="xs tei"
    version="3.0">
    <xsl:output method="json" indent="yes"/>
    <xsl:mode on-no-match="shallow-skip"/>
    <xsl:template match="/">


				<xsl:variable name="files" select="(for $uri in sort(uri-collection('../../data/editions?select=*.xml')) return doc($uri))"/>
				<xsl:variable name="index" as="map(*)*">
					<xsl:for-each select="$files//tei:TEI">
					<xsl:sort select="//tei:idno[@type='alphabetically_sorted']"
													order="ascending"
													data-type="text"/>
					 <xsl:map>
					  <xsl:map-entry key="'id'" select="current()//tei:idno[@type='Bruckner_Kopisten']/text()"/>
						<xsl:map-entry key="'filename'" select="replace(tokenize(base-uri(current()),'/')[last()],'.xml','')"/>
						<xsl:map-entry key="'title'" select="'Kopisten: '||current()//tei:title[@type='main'][@level='a']/text()"/>
						<xsl:map-entry key="'copyist_name'">
							<xsl:variable name="person" select="current()//tei:listPerson/tei:person"/>
						<xsl:choose>
							 <xsl:when test="starts-with($person/tei:persName[@type='main'], 'Kopist')">
                    <xsl:value-of select="$person/tei:idno[@type='alphabetically_sorted']"/>
            </xsl:when>
						<xsl:when test="$person/tei:persName[@subtype]">
                    <xsl:value-of select="concat(
                        $person/tei:persName[@type='main'],
                        ' (',
                        $person/tei:persName/@subtype, ')')"/>

            </xsl:when>
            <xsl:otherwise>
                    <xsl:value-of select="$person/tei:persName[@type='main']"/>
            </xsl:otherwise>
						</xsl:choose>
						</xsl:map-entry>
						 </xsl:map>
					</xsl:for-each>
					</xsl:variable>
						<xsl:copy-of select="array {$index}"/>
    </xsl:template>
</xsl:stylesheet>
